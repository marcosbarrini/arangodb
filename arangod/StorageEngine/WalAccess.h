////////////////////////////////////////////////////////////////////////////////
/// DISCLAIMER
///
/// Copyright 2014-2017 ArangoDB GmbH, Cologne, Germany
/// Copyright 2004-2014 triAGENS GmbH, Cologne, Germany
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///
/// Copyright holder is ArangoDB GmbH, Cologne, Germany
///
/// @author Simon Grätzer
////////////////////////////////////////////////////////////////////////////////

#ifndef ARANGOD_STORAGE_ENGINE_WAL_ACCESS_H
#define ARANGOD_STORAGE_ENGINE_WAL_ACCESS_H 1

#include "Basics/Result.h"
#include "Utils/CollectionGuard.h"
#include "Utils/DatabaseGuard.h"
#include "VocBase/voc-types.h"

#include <velocypack/Builder.h>

namespace arangodb {
  
struct WalAccessResult : public Result {
  WalAccessResult()
    : Result(TRI_ERROR_NO_ERROR), _fromTickIncluded(false), _lastTick(0) {}
  WalAccessResult(int code, bool ft, TRI_voc_tick_t last)
    : Result(code), _fromTickIncluded(ft), _lastTick(last) {}

  bool fromTickIncluded() const { return _fromTickIncluded; }
  TRI_voc_tick_t lastTick() const { return _lastTick; }

  Result& reset(int errorNumber, bool ft, TRI_voc_tick_t last) {
    _errorNumber = errorNumber;
    _fromTickIncluded = ft;
    _lastTick = last;
    return *this;
  }
  
 private:
  bool _fromTickIncluded;
  TRI_voc_tick_t _lastTick;
};

/// @brief StorageEngine agnostic wal access interface.
/// TODO: add methods for _admin/wal/ and get rid of engine specific handlers
class WalAccess {
  WalAccess(WalAccess const&) = delete;
  WalAccess& operator=(WalAccess const&) = delete;

 protected:
  WalAccess() {}
  virtual ~WalAccess() {};

 public:
  
  struct Filter {
    Filter() {}
    
    /// In case collection is == 0,
    bool includeSystem = false;
    
    /// only output markers from this database
    TRI_voc_tick_t vocbase = 0;
    /// Only output data from this collection
    /// FIXME: make a set of collections
    TRI_voc_cid_t collection = 0;
    
    /// only include these transactions, up to
    /// (not including) firstRegularTick
    std::unordered_set<TRI_voc_tid_t> transactionIds;
    /// @brief starting from this tick ignore transactionIds
    TRI_voc_tick_t firstRegularTick = 0;
  };
  
  typedef std::function<void(TRI_vocbase_t*,
                        velocypack::Slice const&)> MarkerCallback;
  typedef std::function<void(TRI_voc_tid_t, TRI_voc_tid_t)> TransactionCallback;

  /// {"tickMin":"123", "tickMax":"456",
  ///  "server":{"version":"3.2", "serverId":"abc"}}
  virtual Result tickRange(std::pair<TRI_voc_tick_t,
                                     TRI_voc_tick_t>& minMax) const = 0;

  /// {"lastTick":"123",
  ///  "server":{"version":"3.2",
  ///  "serverId":"abc"},
  ///  "clients": {
  ///    "serverId": "ass", "lastTick":"123", ...
  ///  }}
  ///
  virtual TRI_voc_tick_t lastTick() const = 0;
  
  /// should return the list of transactions started, but not committed in that
  /// range (range can be adjusted)
  virtual WalAccessResult openTransactions(uint64_t tickStart, uint64_t tickEnd,
                                           Filter const& filter,
                                           TransactionCallback const&) const = 0;

  virtual WalAccessResult tail(uint64_t tickStart, uint64_t tickEnd,
                               size_t chunkSize, Filter const& filter,
                               MarkerCallback const&) const = 0;
  
};
  
/// @brief helper class used to resolve vocbases
///        and collections from wal markers in an efficient way
struct WalAccessContext {
  
  WalAccessContext(WalAccess::Filter const& filter,
                   WalAccess::MarkerCallback const& c)
  : _filter(filter),
    _callback(c),
    _responseSize(0){}
  
  ~WalAccessContext() {}
  
  /// @brief Check if collection is in filter
  bool shouldHandleCollection(TRI_voc_tick_t dbid,
                              TRI_voc_cid_t cid);
  
  /// @brief try to get collection, may return null
  TRI_vocbase_t* loadVocbase(TRI_voc_tick_t dbid);
  
  LogicalCollection* loadCollection(TRI_voc_tick_t dbid,
                                    TRI_voc_cid_t cid);
  
  /// @brief get global unique id
  /*std::string const& cidToUUID(TRI_voc_tick_t dbid, TRI_voc_cid_t cid);
  
  /// @brief cid to collection name
  std::string cidToName(TRI_voc_tick_t dbid, TRI_voc_cid_t cid);*/
  
public:
  /// @brief arbitrary collection filter (inclusive)
  WalAccess::Filter _filter;
  /// @brief callback for marker output
  WalAccess::MarkerCallback _callback;
  
  /// @brief current response size
  size_t _responseSize;
  
  /// @brief result builder
  velocypack::Builder _builder;
  
  /// @brief cache the vocbases
  std::map<TRI_voc_tick_t, DatabaseGuard> _vocbases;
  
  // @brief collection replication UUID cache
  std::map<TRI_voc_cid_t, CollectionGuard> _collectionCache;
};
  
} // namespace arangodb

#endif

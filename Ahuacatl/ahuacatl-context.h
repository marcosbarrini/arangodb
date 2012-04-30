////////////////////////////////////////////////////////////////////////////////
/// @brief Ahuacatl, query context
///
/// @file
///
/// DISCLAIMER
///
/// Copyright 2010-2012 triagens GmbH, Cologne, Germany
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
/// Copyright holder is triAGENS GmbH, Cologne, Germany
///
/// @author Jan Steemann
/// @author Copyright 2012, triagens GmbH, Cologne, Germany
////////////////////////////////////////////////////////////////////////////////

#ifndef TRIAGENS_DURHAM_AHUACATL_CONTEXT_H
#define TRIAGENS_DURHAM_AHUACATL_CONTEXT_H 1

#include <BasicsC/common.h>
#include <BasicsC/strings.h>
#include <BasicsC/hashes.h>
#include <BasicsC/vector.h>
#include <BasicsC/associative.h>
#include <BasicsC/json.h>

#include "VocBase/vocbase.h"
#include "VocBase/collection.h"

#include "Ahuacatl/ahuacatl-error.h"
#include "Ahuacatl/ahuacatl-parser.h"
#include "Ahuacatl/ahuacatl-variable.h"

#ifdef __cplusplus
extern "C" {
#endif

// -----------------------------------------------------------------------------
// --SECTION--                                                      public types
// -----------------------------------------------------------------------------

////////////////////////////////////////////////////////////////////////////////
/// @addtogroup Ahuacatl
/// @{
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
/// @brief a variable scope
////////////////////////////////////////////////////////////////////////////////

typedef struct TRI_aql_scope_s {
  struct TRI_aql_scope_s* _parent;
  TRI_associative_pointer_t _variables; 
  void* _first;
  void* _last;
}
TRI_aql_scope_t;

////////////////////////////////////////////////////////////////////////////////
/// @brief the context for parsing a query
////////////////////////////////////////////////////////////////////////////////

typedef struct TRI_aql_context_s {
  TRI_aql_parser_t* _parser;
  TRI_vector_pointer_t _scopes;
  TRI_vector_pointer_t _nodes;
  TRI_vector_pointer_t _strings;
  TRI_vector_pointer_t _stack;
  TRI_vector_pointer_t _collections;
  TRI_aql_error_t _error;
  TRI_vocbase_t* _vocbase;
  TRI_associative_pointer_t _parameterValues;
  TRI_associative_pointer_t _parameterNames;
  TRI_associative_pointer_t _collectionNames;
  void* _first;
  char* _query;
}
TRI_aql_context_t;

////////////////////////////////////////////////////////////////////////////////
/// @}
////////////////////////////////////////////////////////////////////////////////

// -----------------------------------------------------------------------------
// --SECTION--                                        constructors / destructors
// -----------------------------------------------------------------------------

////////////////////////////////////////////////////////////////////////////////
/// @addtogroup Ahuacatl
/// @{
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
/// @brief create and initialize a context
////////////////////////////////////////////////////////////////////////////////

TRI_aql_context_t* TRI_CreateContextAql (TRI_vocbase_t*, 
                                         const char* const); 

////////////////////////////////////////////////////////////////////////////////
/// @brief free a context
////////////////////////////////////////////////////////////////////////////////

void TRI_FreeContextAql (TRI_aql_context_t* const);

////////////////////////////////////////////////////////////////////////////////
/// @brief parse & validate the query string
////////////////////////////////////////////////////////////////////////////////
  
bool TRI_ValidateQueryContextAql (TRI_aql_context_t* const);

////////////////////////////////////////////////////////////////////////////////
/// @brief add bind parameters to the query context
////////////////////////////////////////////////////////////////////////////////
 
bool TRI_BindQueryContextAql (TRI_aql_context_t* const, const TRI_json_t* const);

////////////////////////////////////////////////////////////////////////////////
/// @brief perform some AST optimisations
////////////////////////////////////////////////////////////////////////////////

bool TRI_OptimiseQueryContextAql (TRI_aql_context_t* const);

////////////////////////////////////////////////////////////////////////////////
/// @brief acquire all locks necessary for the query
////////////////////////////////////////////////////////////////////////////////

bool TRI_LockQueryContextAql (TRI_aql_context_t* const);

////////////////////////////////////////////////////////////////////////////////
/// @brief create a new variable scope
////////////////////////////////////////////////////////////////////////////////

TRI_aql_scope_t* TRI_CreateScopeAql (void);

////////////////////////////////////////////////////////////////////////////////
/// @brief free a variable scope
////////////////////////////////////////////////////////////////////////////////

void TRI_FreeScopeAql (TRI_aql_scope_t* const);

////////////////////////////////////////////////////////////////////////////////
/// @brief register a node
////////////////////////////////////////////////////////////////////////////////

bool TRI_RegisterNodeContextAql (TRI_aql_context_t* const,
                                 void* const);

////////////////////////////////////////////////////////////////////////////////
/// @brief register an error
////////////////////////////////////////////////////////////////////////////////

void TRI_SetErrorContextAql (TRI_aql_context_t* const, 
                             const int, 
                             const char* const);

////////////////////////////////////////////////////////////////////////////////
/// @brief push something on the stack
////////////////////////////////////////////////////////////////////////////////

bool TRI_PushStackAql (TRI_aql_context_t* const, const void* const);

////////////////////////////////////////////////////////////////////////////////
/// @brief pop something from the stack
////////////////////////////////////////////////////////////////////////////////

void* TRI_PopStackAql (TRI_aql_context_t* const);

////////////////////////////////////////////////////////////////////////////////
/// @brief peek at the end of the stack
////////////////////////////////////////////////////////////////////////////////

void* TRI_PeekStackAql (TRI_aql_context_t* const);

////////////////////////////////////////////////////////////////////////////////
/// @brief get first statement in the current scope
////////////////////////////////////////////////////////////////////////////////

void* TRI_GetFirstStatementAql (TRI_aql_context_t* const);

////////////////////////////////////////////////////////////////////////////////
/// @brief add a statement to the current context
////////////////////////////////////////////////////////////////////////////////

bool TRI_AddStatementAql (TRI_aql_context_t* const, const void* const);

////////////////////////////////////////////////////////////////////////////////
/// @brief create a new variable scope and stack it in the context
////////////////////////////////////////////////////////////////////////////////

TRI_aql_scope_t* TRI_StartScopeContextAql (TRI_aql_context_t* const);

////////////////////////////////////////////////////////////////////////////////
/// @brief remove a variable scope from context scopes stack
////////////////////////////////////////////////////////////////////////////////

void TRI_EndScopeContextAql (TRI_aql_context_t* const);

////////////////////////////////////////////////////////////////////////////////
/// @brief move the contents of the outermost variable scope into the previous 
////////////////////////////////////////////////////////////////////////////////

bool TRI_ExchangeScopeContextAql (TRI_aql_context_t* const context);

////////////////////////////////////////////////////////////////////////////////
/// @brief push a variable into the current scope context
////////////////////////////////////////////////////////////////////////////////

bool TRI_AddVariableContextAql (TRI_aql_context_t* const, const char*);

////////////////////////////////////////////////////////////////////////////////
/// @brief register a string
////////////////////////////////////////////////////////////////////////////////

char* TRI_RegisterStringAql (TRI_aql_context_t* const, 
                             const char* const,
                             const size_t);

////////////////////////////////////////////////////////////////////////////////
/// @brief checks if a variable is defined in the current scope or above
////////////////////////////////////////////////////////////////////////////////

bool TRI_VariableExistsAql (TRI_aql_context_t* const, const char* const);

////////////////////////////////////////////////////////////////////////////////
/// @}
////////////////////////////////////////////////////////////////////////////////

#ifdef __cplusplus
}
#endif

#endif

// Local Variables:
// mode: outline-minor
// outline-regexp: "^\\(/// @brief\\|/// {@inheritDoc}\\|/// @addtogroup\\|// --SECTION--\\|/// @\\}\\)"
// End:

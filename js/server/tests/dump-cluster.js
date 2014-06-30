////////////////////////////////////////////////////////////////////////////////
/// @brief tests for dump/reload
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
/// @author Copyright 2012, triAGENS GmbH, Cologne, Germany
////////////////////////////////////////////////////////////////////////////////

var internal = require("internal");
var jsunity = require("jsunity");

////////////////////////////////////////////////////////////////////////////////
/// @brief test suite
////////////////////////////////////////////////////////////////////////////////

function dumpTestSuite () {
  var db = internal.db;

  return {

////////////////////////////////////////////////////////////////////////////////
/// @brief set up
////////////////////////////////////////////////////////////////////////////////

    setUp : function () {
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief tear down
////////////////////////////////////////////////////////////////////////////////

    tearDown : function () {
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test the empty collection
////////////////////////////////////////////////////////////////////////////////
    
    testEmpty : function () {
      var c = db._collection("UnitTestsDumpEmpty");
      var p = c.properties();

      assertEqual(2, c.type()); // document
      assertTrue(p.waitForSync);
      assertFalse(p.isVolatile);

      assertEqual(1, c.getIndexes().length); // just primary index
      assertEqual("primary", c.getIndexes()[0].type);
      assertEqual(0, c.count());
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test the collection with many documents
////////////////////////////////////////////////////////////////////////////////
    
    testMany : function () {
      var c = db._collection("UnitTestsDumpMany");
      var p = c.properties();

      assertEqual(2, c.type()); // document
      assertFalse(p.waitForSync);
      assertFalse(p.isVolatile);

      assertEqual(1, c.getIndexes().length); // just primary index
      assertEqual("primary", c.getIndexes()[0].type);
      assertEqual(100000, c.count());

      var doc;
      var i;

      // test all documents
      for (i = 0; i < 100000; ++i) {
        doc = c.document("test" + i);
        assertEqual(i, doc.value1);
        assertEqual("this is a test", doc.value2);
        assertEqual("test" + i, doc.value3);
      }

      doc = c.first();
      assertEqual("test0", doc._key);
      assertEqual(0, doc.value1);
      assertEqual("this is a test", doc.value2);
      assertEqual("test0", doc.value3);
      
      doc = c.last();
      assertEqual("test99999", doc._key);
      assertEqual(99999, doc.value1);
      assertEqual("this is a test", doc.value2);
      assertEqual("test99999", doc.value3);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test the edges collection
////////////////////////////////////////////////////////////////////////////////
    
    testEdges : function () {
      var c = db._collection("UnitTestsDumpEdges");
      var p = c.properties();

      assertEqual(3, c.type()); // edges
      assertFalse(p.waitForSync);
      assertFalse(p.isVolatile);

      assertEqual(2, c.getIndexes().length); // primary index + edges index
      assertEqual("primary", c.getIndexes()[0].type);
      assertEqual("edge", c.getIndexes()[1].type);
      assertEqual(10, c.count());

      var doc;
      var i;

      // test all documents
      for (i = 0; i < 10; ++i) {
        doc = c.document("test" + i);
        assertEqual("test" + i, doc._key);
        assertEqual("UnitTestsDumpMany/test" + i, doc._from);
        assertEqual("UnitTestsDumpMany/test" + (i + 1), doc._to);
        assertEqual(i + "->" + (i + 1), doc.what);
      }

      doc = c.first();
      assertEqual("test0", doc._key);
      assertEqual("UnitTestsDumpMany/test0", doc._from);
      assertEqual("UnitTestsDumpMany/test1", doc._to);
      assertEqual("0->1", doc.what);
      
      doc = c.last();
      assertEqual("test9", doc._key);
      assertEqual("UnitTestsDumpMany/test9", doc._from);
      assertEqual("UnitTestsDumpMany/test10", doc._to);
      assertEqual("9->10", doc.what);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test the order of documents
////////////////////////////////////////////////////////////////////////////////
    
    testOrder : function () {
      var c = db._collection("UnitTestsDumpOrder");
      var p = c.properties();

      assertEqual(2, c.type()); // document
      assertFalse(p.waitForSync);
      assertFalse(p.isVolatile);

      assertEqual(1, c.getIndexes().length); // just primary index
      assertEqual("primary", c.getIndexes()[0].type);
      assertEqual(3, c.count());

      var doc;

      doc = c.first();
      assertEqual("three", doc._key);
      assertEqual(3, doc.value);
      assertEqual(123, doc.value2);

      doc = c.first(2)[1];
      assertEqual("two", doc._key);
      assertEqual(2, doc.value);
      assertEqual(456, doc.value2);

      doc = c.first(3)[2];
      assertEqual("one", doc._key);
      assertEqual(1, doc.value);
      assertEqual(789, doc.value2);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test document removal & update
////////////////////////////////////////////////////////////////////////////////
    
    testRemoved : function () {
      var c = db._collection("UnitTestsDumpRemoved");
      var p = c.properties();

      assertEqual(2, c.type()); // document
      assertFalse(p.waitForSync);
      assertFalse(p.isVolatile);

      assertEqual(1, c.getIndexes().length); // just primary index
      assertEqual("primary", c.getIndexes()[0].type);
      assertEqual(9000, c.count());

      var i;
      for (i = 0; i < 10000; ++i) {
        if (i % 10 === 0) {
          assertFalse(c.exists("test" + i));
        }
        else {
          var doc = c.document("test" + i);
          assertEqual(i, doc.value1);

          if (i < 1000) {
            assertEqual(i + 1, doc.value2);
          }
        }
      }
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test indexes
////////////////////////////////////////////////////////////////////////////////
    
    testIndexes : function () {
      var c = db._collection("UnitTestsDumpIndexes");
      var p = c.properties();

      assertEqual(2, c.type()); // document
      assertFalse(p.waitForSync);
      assertFalse(p.isVolatile);

      assertEqual(6, c.getIndexes().length); 
      assertEqual("primary", c.getIndexes()[0].type);
      assertEqual("hash", c.getIndexes()[1].type);
      assertTrue(c.getIndexes()[1].unique);
      assertEqual([ "a_uc" ], c.getIndexes()[1].fields);
      assertEqual("skiplist", c.getIndexes()[2].type);
      assertFalse(c.getIndexes()[2].unique);
      assertEqual([ "a_s1", "a_s2" ], c.getIndexes()[2].fields);
      assertFalse(c.getIndexes()[3].unique);
      assertEqual("fulltext", c.getIndexes()[3].type);
      assertEqual([ "a_f" ], c.getIndexes()[3].fields);
      assertEqual("geo2", c.getIndexes()[4].type);
      assertEqual([ "a_la", "a_lo" ], c.getIndexes()[4].fields);
      assertFalse(c.getIndexes()[4].unique);
      assertEqual("cap", c.getIndexes()[5].type);
      assertEqual(1000, c.getIndexes()[5].size);
      assertEqual(1048576, c.getIndexes()[5].byteSize);

      assertEqual(0, c.count());
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test truncate
////////////////////////////////////////////////////////////////////////////////
    
    testTruncated : function () {
      var c = db._collection("UnitTestsDumpTruncated");
      var p = c.properties();

      assertEqual(2, c.type()); // document
      assertFalse(p.waitForSync);
      assertTrue(p.isVolatile);

      assertEqual(1, c.getIndexes().length); // just primary index
      assertEqual("primary", c.getIndexes()[0].type);
      assertEqual(0, c.count());
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test shards
////////////////////////////////////////////////////////////////////////////////
    
    testShards : function () {
      var c = db._collection("UnitTestsDumpShards");
      var p = c.properties();

      assertEqual(2, c.type()); // document
      assertFalse(p.waitForSync);
      assertFalse(p.isVolatile);
      assertEqual(9, p.numberOfShards);

      assertEqual(1, c.getIndexes().length); // just primary index
      assertEqual("primary", c.getIndexes()[0].type);
      assertEqual(1000, c.count());
  
      for (var i = 0; i < 1000; ++i) {
        var doc = c.document(String(7 + (i * 42)));

        assertEqual(String(7 + (i * 42)), doc._key);
        assertEqual(i, doc.value);
        assertEqual({ value: [ i, i ] }, doc.more);
      }
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test strings
////////////////////////////////////////////////////////////////////////////////
    
    testStrings : function () {
      var c = db._collection("UnitTestsDumpStrings");
      var p = c.properties();

      assertEqual(2, c.type()); // document
      assertFalse(p.waitForSync);
      assertFalse(p.isVolatile);

      assertEqual(1, c.getIndexes().length); // just primary index
      assertEqual("primary", c.getIndexes()[0].type);
      assertEqual(8, c.count());

      var texts = [
        "big. Really big. He moment. Magrathea! - insisted Arthur, - I do you can sense no further because it doesn't fit properly. In my the denies faith, and the atmosphere beneath You are not cheap He was was his satchel. He throughout Magrathea. - He pushed a tore the ecstatic crowd. Trillian sat down the time, the existence is it? And he said, - What they don't want this airtight hatchway. - it's we you shooting people would represent their Poet Master Grunthos is in his mind.",
        "Ultimo cadere chi sedete uso chiuso voluto ora. Scotendosi portartela meraviglia ore eguagliare incessante allegrezza per. Pensava maestro pungeva un le tornano ah perduta. Fianco bearmi storia soffio prende udi poteva una. Cammino fascino elisire orecchi pollici mio cui sai sul. Chi egli sino sei dita ben. Audace agonie groppa afa vai ultima dentro scossa sii. Alcuni mia blocco cerchi eterno andare pagine poi. Ed migliore di sommesso oh ai angoscia vorresti.", 
        "Νέο βάθος όλα δομές της χάσει. Μέτωπο εγώ συνάμα τρόπος και ότι όσο εφόδιο κόσμου. Προτίμηση όλη διάφορους του όλο εύθραυστη συγγραφής. Στα άρα ένα μία οποία άλλων νόημα. Ένα αποβαίνει ρεαλισμού μελετητές θεόσταλτο την. Ποντιακών και rites κοριτσάκι παπούτσια παραμύθια πει κυρ.",
        "Mody laty mnie ludu pole rury Białopiotrowiczowi. Domy puer szczypię jemy pragnął zacność czytając ojca lasy Nowa wewnątrz klasztoru. Chce nóg mego wami. Zamku stał nogą imion ludzi ustaw Białopiotrowiczem. Kwiat Niesiołowskiemu nierostrzygniony Staje brał Nauka dachu dumę Zamku Kościuszkowskie zagon. Jakowaś zapytać dwie mój sama polu uszakach obyczaje Mój. Niesiołowski książkowéj zimny mały dotychczasowa Stryj przestraszone Stolnikównie wdał śmiertelnego. Stanisława charty kapeluszach mięty bratem każda brząknął rydwan.",
        "Мелких против летают хижину тмится. Чудесам возьмет звездна Взжигай. . Податель сельские мучитель сверкает очищаясь пламенем. Увы имя меч Мое сия. Устранюсь воздушных Им от До мысленные потушатся Ко Ея терпеньем.", 
        "dotyku. Výdech spalin bude položen záplavový detekční kabely 1x UPS Newave Conceptpower DPA 5x 40kVA bude ukončen v samostatné strojovně. Samotné servery mají pouze lokalita Ústí nad zdvojenou podlahou budou zakončené GateWayí HiroLink - Monitoring rozvaděče RTN na jednotlivých záplavových zón na soustrojí resp. technologie jsou označeny SA-MKx.y. Jejich výstupem je zajištěn přestupem dat z jejich provoz. Na dveřích vylepené výstražné tabulky. Kabeláž z okruhů zálohovaných obvodů v R.MON-I. Monitoring EZS, EPS, ... možno zajistit funkčností FireWallů na strukturovanou kabeláží vedenou v měrných jímkách zapuštěných v každém racku budou zakončeny v R.MON-NrNN. Monitoring motorgenerátorů: řídící systém bude zakončena v modulu",
        "ramien mu zrejme vôbec niekto je už presne čo mám tendenciu prispôsobiť dych jej páčil, čo chce. Hmm... Včera sa mi pozdava, len dočkali, ale keďže som na uz boli u jej nezavrela. Hlava jej to ve městě nepotká, hodně mi to tí vedci pri hre, keď je tu pre Designiu. Pokiaľ viete o odbornejšie texty. Prvým z tmavých uličiek, každý to niekedy, zrovnávať krok s obrovským batohom na okraj vane a temné úmysly, tak rozmýšľam, aký som si hromady mailov, čo chcem a neraz sa pokúšal o filmovém klubu v budúcnosti rozhodne uniesť mladú maliarku (Linda Rybová), ktorú so",
        " 復讐者」. 復讐者」. 伯母さん 復讐者」. 復讐者」. 復讐者」. 復讐者」. 第九章 第五章 第六章 第七章 第八章. 復讐者」 伯母さん. 復讐者」 伯母さん. 第十一章 第十九章 第十四章 第十八章 第十三章 第十五章. 復讐者」 . 第十四章 第十一章 第十二章 第十五章 第十七章 手配書. 第十四章 手配書 第十八章 第十七章 第十六章 第十三章. 第十一章 第十三章 第十八章 第十四章 手配書. 復讐者」."
      ];

      texts.forEach(function (t, i) { 
        var doc = c.document("text" + i);
        
        assertEqual(t, doc.value);
      });

    }

  };
}

////////////////////////////////////////////////////////////////////////////////
/// @brief executes the test suite
////////////////////////////////////////////////////////////////////////////////

jsunity.run(dumpTestSuite);

return jsunity.done();

// Local Variables:
// mode: outline-minor
// outline-regexp: "^\\(/// @brief\\|/// @addtogroup\\|// --SECTION--\\|/// @page\\|/// @}\\)"
// End:

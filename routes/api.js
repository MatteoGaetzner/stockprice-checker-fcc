/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');

var api_helper = require('../API_helper')
var token = process.env.TOKEN
var functions = require('../functions')

var checkExistance = functions.checkExistance;
var updateWithoutLike = functions.updateWithoutLike;
var updateWithLike = functions.updateWithLike;
var checkForLikedByIp = functions.checkForLikedByIp;
var createFirstOutputObj = functions.createFirstOutputObj;
var createSecondOutputObj = functions.createSecondOutputObj;
var createFinalObj = functions.createFinalObj;

const CONNECTION_STRING = process.env.DB; 
//MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res){ 
    const stock = req.query.stock
    const like = () => {
      return req.query.like ? 1 : 0
    }
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    if(typeof(stock) === 'string'){
    // 'Get single price and total likes'
      
    // Get stock-data from external IEX-api
      api_helper.make_API_call(stock)
          .then(data => {
          // If there is no such stock...
         try{
          const lastSalePrice = data[0].lastSalePrice
          var dbRes;
           
          // Connect to own database
          MongoClient.connect(CONNECTION_STRING, async function(err, db) {
              db.collection('stocks').remove({})
              var result = await createFinalObj(req, db, stock, ip, lastSalePrice)
              console.log(result)
              res.json(result)
          })
           
         } catch(err){
           console.log(err)
           res.json({error: stock + ': stock does not exist'})
         }
        
        })
    } else {
      // 'Compare and get relative likes'
      api_helper.make_API_call(stock[0])
          .then(data1 => {
        api_helper.make_API_call(stock[1])
            .then(data2 => {
          try{
            const stock1 = stock[0]
            const stock2 = stock[1]
            const lastSalePrice1 = data1[0].lastSalePrice
            const lastSalePrice2 = data2[0].lastSalePrice
            
             // Connect to own database
            MongoClient.connect(CONNECTION_STRING, async function(err, db) {
            var result1 = await createFinalObj(req, db, stock1, ip, lastSalePrice1)
            var result2 = await createFinalObj(req, db, stock2, ip, lastSalePrice2)
            res.json(createSecondOutputObj(stock1, stock2, lastSalePrice1, lastSalePrice2, result1.stockData.likes, result2.stockData.likes))
          })
            
            var dbRes;
          } catch(err){
            console.log(err)
            var falseNames = (data1[0] === undefined) ? stock[0] : stock[1]
            if(data2[0] !== undefined){
            res.json({error: falseNames + ': No stock found under this symbol.'})
            } else {
            res.json({error: stock[0] + ',' + stock[1] + ': No stocks found under these names.'})
            }
          }
        })  
      })
      }
    });
    
};
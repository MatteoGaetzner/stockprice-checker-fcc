module.exports = new function(){
    // Check whether doc exists
      this.checkExistance = async (db, stock) => {
        var result = await db.collection('stocks').findOne({stock: stock})
        return (result === null) ? false : result
      },
    // Declare Update function without like
      this.updateWithoutLike = (db, stock, lastSalePrice) => db.collection('stocks').findOneAndUpdate(
        {stock: stock},
        {
          $set: {
            price: lastSalePrice
          },
          $setOnInsert: {
            stock: stock,
            likedBy: [],
          },
          $inc: {
            likes: 0
          }
        },
        {
          upsert: true,
          returnOriginal: false
        }
      ),
      
    // Declare Function "update with likes++ and push ip to likedBy (upsert)"
      this.updateWithLike = (db, stock, lastSalePrice, ip) => db.collection('stocks').findOneAndUpdate(
        {stock: stock},
        {
          $setOnInsert: {
            stock: stock
          },
          $set: {
            price: lastSalePrice
          },
          $addToSet: {
            likedBy: ip
          },
          $inc: {
            likes: 1
          }
        },
        {
          upsert: true,
          returnOriginal: false
        }
      ),
    // function to check whether liked by this ip
      this.checkForLikedByIp = async (db, stock, ip) => {
        const searchRes = await db.collection('stocks').findOne({stock: stock})
        if(searchRes != null){
          if(searchRes.likedBy.indexOf(ip) > -1){
            return true;
          }
        }
        return false;
      },
    // create output Object for first form
    this.createFirstOutputObj = (stock, price, likes) => {
      return {
      stockData: {stock: stock, price: price, likes: likes}
      }
    },
    // create output Object for second form
    this.createSecondOutputObj = (stock1, stock2, price1, price2, likes1, likes2) => {
      return {
        stockData: 
          [{stock: stock1, price: price1, rel_likes: (likes1-likes2)},
          {stock: stock2, price: price2, rel_likes: (likes2-likes1)}]
      }
    },
    // create final complete Object
    this.createFinalObj = async (req, db, stock, ip, lastSalePrice) => {
      // Check whether stock is saved in Database
              var exists = await this.checkExistance(db, stock)
              
              if(exists){
                // Check whether User checked like-tickbox
                if(req.query.like){
                  // Check whether liked by this ip
                  var likedByThisIp = await this.checkForLikedByIp(db, stock, ip)
                  if (likedByThisIp){
                    // Create OutputObj and send response
                    console.log(stock + ': Already liked by this ip')
                    var outputObj = this.createFirstOutputObj(exists.stock, exists.price, exists.likes)
                    return outputObj
                  } else {
                    // Not yet liked by this ip
                    console.log(stock + ': Not yet liked by this ip')
                    var result = await this.updateWithLike(db, stock, lastSalePrice, ip)
                    var outputObj = this.createFirstOutputObj(result.value.stock, result.value.price, result.value.likes)
                    return outputObj
                  }
                } else {
                  // Not ticked like-tickbox
                  console.log(stock + ': Not ticked like-tickbox')
                  var result = await this.updateWithoutLike(db, stock, lastSalePrice, ip)
                  var outputObj = this.createFirstOutputObj(result.value.stock, result.value.price, result.value.likes)
                    return outputObj
                }
              } else {
              // Doc not in Database yet
                // Check whether User checked like-tickbox
                if(req.query.like){
                  console.log(stock + ': Ticked like-tickbox')
                  var result = await this.updateWithLike(db, stock, lastSalePrice, ip)
                  var outputObj = this.createFirstOutputObj(result.value.stock, result.value.price, result.value.likes)
                  return outputObj
                } else {
                  console.log(stock + ': Not ticked like-tickbox')
                // Not ticked like-tickbox
                  var result = await this.updateWithoutLike(db, stock, lastSalePrice, ip)
                  var outputObj = this.createFirstOutputObj(result.value.stock, result.value.price, result.value.likes)
                  return outputObj
                }
              }
    }
  
}
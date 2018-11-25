var express = require('express');
var router = express.Router();
var gplay = require('google-play-scraper');
const fs = require('fs');

/* GET users listing. */
router.get('/', function(req, res, next) {

  const appId = req.query.appId

  if (!appId) res.send(`No app id provided`);

  gplay.app({
    appId,
    throttle: 10
  })
    .then((data) => {
      // find the number of pages for reviews
      // each page contains max 40 reviews
      const pages = Math.ceil(data.reviews/40);
      const promiseArray = [];

      for (let i = 0; i < pages; i++) {
        // create a arry of promise for fetch reviews on each page
        const promise = new Promise((resolve) => {
          let reviewsEachPage = '';
          gplay.reviews({
            appId,
            page: i,
            sort: gplay.sort.RATING,
            throttle: 10
          }).then((fetchedReviews) => {
            fetchedReviews.forEach(review => {
              reviewsEachPage += review.text ? `${review.text}\n` : '';
            });
            console.log(`Page ${i} review has been fetched!`);
            resolve(reviewsEachPage)
          });
        })
        promiseArray.push(promise);
      }

      // wait for all promises to return results
      Promise.all(promiseArray)
        .then(values => {
          const reviews = values.join('\n');
          fs.writeFile(`./public/${appId}.txt`, reviews, (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
            res.render('reviews', { numReviews: data.reviews, appId});
          });
        })
    })
    .catch(console.log)
});

module.exports = router;

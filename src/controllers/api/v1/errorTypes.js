/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    1/20/19 4:43 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var _ = require('lodash')
var async = require('async')
var ErrorTypeSchema = require('../../../models/errorType')
var apiErrorTypes = {}

/**
 * @api {post} /api/v1/errorTypes/create Creates an error type
 * @apiName createErrorType
 * @apiDescription Create an error type
 * @apiVersion 0.1.6
 * @apiGroup ErrorTypes
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "Content-Type: application/json" -H "accesstoken: {accesstoken}" -X POST -d "{\"errorType\": {errorType}}" -l http://localhost/api/v1/errorTypes/create
 *
 * @apiParamExample {json} Request-Example:
 {
     "errorType": {errorType}
 }
 *
 * @apiSuccess {boolean} success Successfully?
 * @apiSuccess {boolean} errorType Saved Error Type
 *
 * @apiError InvalidPostData Invalid Post Data
 */
apiErrorTypes.createErrorType = function (req, res) {
  var data = req.body
  if (_.isUndefined(data.errorType)) return res.status(400).json({ error: 'Invalid Post Data' })

  var ErrorType = new ErrorTypeSchema({
    name: data.errorType
  })

  ErrorType.save(function (err, ET) {
    if (err) return res.status(400).json({ error: err.message })

    return res.json({ success: true, errorType: ET })
  })
}

apiErrorTypes.getErrorTypesWithLimit = function (req, res) {
  var qs = req.query
  var limit = qs.limit ? qs.limit : 25
  var page = qs.page ? qs.page : 0

  var errorTypeSchema = require('../../../models/errorType')
  var result = { success: true }

  async.parallel(
    [
      function (done) {
        try {
          errorTypeSchema.getErrorTypesWithLimit(parseInt(limit), parseInt(page), function (err, errorTypes) {
            if (err) return done(err)

            result.errorTypes = errorTypes
            return done()
          })
        } catch (e) {
          return done({ message: 'Invalid Limit and/or page' })
        }
      },
      function (done) {
        errorTypeSchema.countDocuments({}, function (err, count) {
          if (err) return done(err)
          result.count = count

          return done()
        })
      }
    ],
    function (err) {
      if (err) return res.status(500).json({ success: false, error: err.message })

      return res.json(result)
    }
  )
}

/**
 * @api {put} /api/v1/errorTypes/:id Update Error Type
 * @apiName updateErrorType
 * @apiDescription Updates given error type
 * @apiVersion 0.1.7
 * @apiGroup ErrorTypes
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/errorTypes/:id
 *
 * @apiSuccess {boolean} success Successfully?
 * @apiSuccess {object} errorType Updated Error Type
 *
 */
apiErrorTypes.updateErrorType = function (req, res) {
  var id = req.params.id
  var data = req.body
  if (_.isUndefined(id) || _.isNull(id) || _.isNull(data) || _.isUndefined(data)) {
    return res.status(400).json({ success: false, error: 'Invalid Put Data' })
  }

  var errorTypeSchema = require('../../../models/errorType')
  errorTypeSchema.getErrorType(id, function (err, errorType) {
    if (err) return res.status(400).json({ success: false, error: err.message })

    errorType.name = data.name

    errorType.save(function (err, et) {
      if (err) return res.status(400).json({ success: false, error: err.message })

      return res.json({ success: true, errorType: et })
    })
  })
}

/**
 * @api {delete} /api/v1/errorTypes/:id Delete Error Type
 * @apiName deleteErrorType
 * @apiDescription Deletes the given error type
 * @apiVersion 0.1.7
 * @apiGroup ErrorTypes
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/errorTypes/:id
 *
 * @apiSuccess {boolean} success Successfully?
 *
 */
apiErrorTypes.deleteErrorType = function (req, res) {
  var id = req.params.id
  if (_.isUndefined(id) || _.isNull(id)) return res.status(400).json({ success: false, error: 'Invalid Error Type Id' })

  async.series(
    [
      function (next) {
        var ticketModel = require('../../../models/ticket')
        ticketModel.getAllTicketsByErrorType(id, function (err, tickets) {
          if (err) return next(err)
          async.each(
            tickets,
            function (ticket, cb) {
              ticket.errorTypes = _.reject(ticket.errorTypes, function (o) {
                return o._id.toString() === id.toString()
              })

              ticket.save(function (err) {
                return cb(err)
              })
            },
            function (err) {
              if (err) return next(err)

              return next(null)
            }
          )
        })
      },
      function (next) {
        var errorTypeSchema = require('../../../models/errorType')
        errorTypeSchema.findByIdAndRemove(id, function (err) {
          return next(err)
        })
      }
    ],
    function (err) {
      if (err) return res.status(400).json({ success: false, error: err.message })

      return res.json({ success: true })
    }
  )
}

module.exports = apiErrorTypes
var MongoClient = require('mongodb').MongoClient,
	assert = require('assert'),
	ObjectId = require('mongodb').ObjectID,
	logger = require('./logger.js'),
	conf = require('../config.json'),
	users = require('./users.js'),
	url = conf.mongodb.url,
	collection = conf.mongodb.collections.tickets;

module.exports = {
	createTicket: function (title, message, user, callback) {
		if (!users.hasPermission(user, 'ticket_create'))
			return;

		var ticket = {
			'date': new Date(),
			'author': user,
			'status': 'todo',
			'title': title,
			'comments': [{
				'author': user,
				'date': new Date(),
				'content': message
			}],
			'lastModified': new Date()
		};

		MongoClient.connect(url, function (err, db) {
			assert.equal(null, err);

			db.collection(collection).insertOne(
				ticket,
				function (err) {
					assert.equal(err, null);
					db.close();

					logger.log('verbose', 'added ticket', {
						ticket: ticket._id,
						user: user._id,
						ticketContent: ticket
					});

					callback(ticket);
				}
			);
		});
	},
	createComment: function (id, commentContent, user, callback) {
		if (!users.hasPermission(user, 'ticket_comment_create'))
			return;

		var comment = {
			'content': commentContent,
			'date': new Date(),
			'author': user
		};

		MongoClient.connect(url, function (err, db) {
			assert.equal(null, err);

			db.collection(collection).updateOne({
				'_id': ObjectId(id)
			}, {
				$push: {
					'comments': comment
				},
				$currentDate: {
					'lastModified': true
				}
			}, function (err) {
				assert.equal(err, null);
				db.close();

				logger.log('verbose', 'created Comment', {
					ticket: id,
					user: user._id,
					comment: comment
				});

				callback({
					'id': id,
					'comment': comment
				})
			});
		});

		module.exports.findTicket(id, function (ticket) {
			if (ticket.author.uid == user.uid) {
				module.exports.changeStatus(ticket._id, 'todo', user, function () {
				});
			}
		});
	},
	findAllTickets: function (callback) {
		findTickets({}, callback);
	},
	findOwnTickets: function (user, callback) {
		findTickets({'author.uid': user.uid}, callback);
	},
	findTicket: function (ticketId, callback) {
		MongoClient.connect(url, function (err, db) {
			assert.equal(null, err);
			db.collection(collection)
				.find({'_id': ObjectId(ticketId)})
				.limit(1).next(
				function (err, result) {
					callback(result);
				}
			);
		});
	},
	countOwnTickets: function (user, callback) {
		conf.status.forEach(function (status) {
			countTickets({'status': status, 'author.uid': user.uid}, function (amount) {
				callback(status, amount)
			});
		})
	},
	countAllTickets: function (callback) {
		conf.status.forEach(function (status) {
			countTickets({'status': status}, function (amount) {
				callback(status, amount)
			});
		})
	},
	changeStatus: function (id, status, user, callback) {
		updateTicket(id, 'status', user, status, callback);
	},
	addTag: function (id, tag, user, callback) {
		if (!users.hasPermission(user, 'ticket_tag_add'))
			return;

		MongoClient.connect(url, function (err, db) {
			assert.equal(null, err);

			var newData = {};
			newData['tags'] = tag;

			db.collection(collection).updateOne({
				'_id': ObjectId(id)
			}, {
				$addToSet: newData,
				$currentDate: {
					'lastModified': true
				}
			}, function (err, results) {
				assert.equal(err, null);
				db.close();

				logger.log('verbose', 'added Tag', {
					ticket: id,
					user: user._id,
					tag: tag
				});

				callback(results)
			});
		});
	},
	removeTag: function (id, tag, user, callback) {
		if (!users.hasPermission(user, 'ticket_tag_remove'))
			return;

		MongoClient.connect(url, function (err, db) {
			assert.equal(null, err);

			var newData = {};
			newData['tags'] = tag;

			db.collection(collection).updateOne({
				'_id': ObjectId(id)
			}, {
				$pull: newData,
				$currentDate: {
					'lastModified': true
				}
			}, function (err, results) {
				assert.equal(err, null);
				db.close();

				logger.log('verbose', 'removed Tag', {
					ticket: id,
					user: user._id,
					tag: tag
				});

				callback(results)
			});
		});
	},
	removeComment: function (id, tag, user, callback) {
		//TODO
	}
};


updateTicket = function (id, key, user, value, callback) {
	MongoClient.connect(url, function (err, db) {
		assert.equal(null, err);

		var newData = {};
		newData[key] = value;

		db.collection(collection).updateOne({
			'_id': ObjectId(id)
		}, {
			$set: newData,
			$currentDate: {
				'lastModified': true
			}
		}, function (err, results) {
			assert.equal(err, null);
			db.close();

			logger.log('verbose', 'updated Ticket', {
				ticket: id,
				user: user._id,
				key: key,
				value: value
			});

			callback(results)
		});
	});
};

findTickets = function (query, callback) {
	MongoClient.connect(url, function (err, db) {
		assert.equal(null, err);
		db.collection(collection)
			.find(query)
			.forEach(
				function (doc) {
					callback(doc);
				},
				null
			);
	});
};

countTickets = function (query, callback) {
	MongoClient.connect(url, function (err, db) {
		assert.equal(null, err);

		db.collection(collection).count(query, function (error, num) {
			assert.equal(err, null);
			db.close();

			callback(num);
		});
	});
};

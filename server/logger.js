var conf = require( '../config.json' ),
    logger = require( 'winston' ),
    loggerDB = require( 'winston-mongodb' ).MongoDB;

logger.exitOnError = true;

logger.add(
    logger.transports.File,
    conf.logger.file
);

logger.remove(logger.transports.Console);

logger.add(
    logger.transports.Console,
    conf.logger.console
);

logger.add(
    loggerDB,
    conf.logger.mongodb
);

module.exports = logger;

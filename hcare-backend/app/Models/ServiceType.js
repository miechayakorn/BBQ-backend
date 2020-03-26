'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ServiceType extends Model {
    static get primaryKey() {
        return "type_id";
      }
}

module.exports = ServiceType

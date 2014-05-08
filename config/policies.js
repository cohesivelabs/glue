/**
 * Policy mappings (ACL)
 *
 * Policies are simply Express middleware functions which run **before** your controllers.
 * You can apply one or more policies to a given controller, or protect just one of its actions.
 *
 * Any policy file (e.g. `authenticated.js`) can be dropped into the `/policies` folder,
 * at which point it can be accessed below by its filename, minus the extension, (e.g. `authenticated`)
 *
 * For more information on policies, check out:
 * http://sailsjs.org/#documentation
 */


module.exports.policies = {
        
    '*': false,

    SnippetController: {
        '*': false,

        raw: true,

        find: true,
        // both passport and apiKey may change current req.user!
        create:  ['passport', 'apiKey'],
        update:  ['passport', 'apiKey'],
        destroy: ['passport', 'apiKey'],
    },

    UserController: {
        // no public access
        '*': false,

        // passport sets req.user!
        findAll: ['passport', 'auth'],
        update:  ['passport', 'auth'],
        destroy: ['passport', 'auth'],
        find:    ['passport', 'auth'],
    },

    AuthController: {
        '*': ['passport'],
    },
};
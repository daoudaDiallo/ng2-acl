import * as _ from 'lodash';

export class AclService {

    config = {
        // @TODO: To refactor ASAP by adding Redux store
        storage: 'localStorage',
        storageKey: 'AclService'
    };

    data = {
        roles: [],
        abilities: {}
    };

    constructor() {
    }

    /**
     * Does the given role have abilities granted to it?
     *
     * @param role
     * @returns {boolean}
     */
    roleHasAbilities(role) {
        this.resume();
        return (typeof this.data.abilities[role] === 'object');
    }

    /**
     * Retrieve the abilities array for the given role
     *
     * @param role
     * @returns {Array}
     */
    getRoleAbilities(role) {
        this.resume();
        return (this.roleHasAbilities(role)) ? this.data.abilities[role] : [];
    }

    /**
     * Restore data from web storage.
     *
     * Returns true if web storage exists and false if it doesn't.
     *
     * @returns {boolean}
     */
    resume() {
        var storedData;

        switch (this.config.storage) {
            case 'sessionStorage':
                storedData = this.fetchFromStorage('sessionStorage');
                break;
            case 'localStorage':
                storedData = this.fetchFromStorage('localStorage');
                break;
            default:
                storedData = null;
        }
        if (storedData) {
            _.extend(this.data, storedData);
            return true;
        }

        return false;
    }

    /**
     * Attach a role to the current user
     *
     * @param role
     */
    attachRole(role) {
        this.resume();
        if (this.data.roles.indexOf(role) === -1) {
            this.data.roles.push(role);
            this.save();
        }
    }

    /**
     * Remove role from current user
     *
     * @param role
     */
    detachRole(role) {
        this.resume();
        var i = this.data.roles.indexOf(role);
        if (i > -1) {
            this.data.roles.splice(i, 1);
            this.save();
        }
    }

    /**
     * Remove all roles from current user
     */
    flushRoles() {
        this.resume();
        this.data.roles = [];
        this.save();
    }

    /**
     * Check if the current user has role attached
     *
     * @param role
     * @returns {boolean}
     */
    hasRole(role) {
        this.resume();
        return (this.data.roles.indexOf(role) > -1);
    }

    /**
     * Returns the current user roles
     * @returns {Array}
     */
    getRoles() {
        this.resume();
        return this.data.roles;
    }

    /**
     * Set the abilities object (overwriting previous abilities)
     *
     * Each property on the abilities object should be a role.
     * Each role should have a value of an array. The array should contain
     * a list of all of the roles abilities.
     *
     * Example:
     *
     *    {
     *        guest: ['login'],
     *        user: ['logout', 'view_content'],
     *        admin: ['logout', 'view_content', 'manage_users']
     *    }
     *
     * @param abilities
     */
    setAbilities(abilities) {
        this.resume();
        this.data.abilities = abilities;
        this.save();
    }

    /**
     * Add an ability to a role
     *
     * @param role
     * @param ability
     */
    addAbility(role, ability) {
        this.resume();
        if (!this.data.abilities[role]) {
            this.data.abilities[role] = [];
        }
        this.data.abilities[role].push(ability);
        this.save();
    }

    /**
     * Toggle ability of a role
     * If role is empty, current current roles are used
     *
     * @param role
     * @param ability
     * @param [force] - force add or remove
     */
    toggleAbility(role, ability, force) {
        this.resume();
        var roles = role ? [role] : this.data.roles;

        // Loop through roles
        for (var i = 0; i < roles.length; i++) {
            var role = roles[i];

            if (!this.data.abilities[role]) {
                this.data.abilities[role] = [];
            }

            var alreadyAdded = _.indexOf(this.data.abilities[role], ability) !== -1;
            var operation = !alreadyAdded;

            if (!alreadyAdded && force === true) {
                operation = true;
            }

            if (alreadyAdded && force === false) {
                operation = false;
            }

            if (operation === true) {
                this.data.abilities[role].push(ability);
            }

            if (operation === false){
                this.data.abilities[role] = _.without(this.data.abilities[role], ability)
            }
        }

        this.save();
    }

    /**
     * Does current user have permission to do something?
     *
     * @param ability
     * @returns {boolean}
     */
    can(ability) {
        this.resume();
        var role, abilities;
        // Loop through roles
        var l = this.data.roles.length;
        for (; l--;) {
            // Grab the the current role
            role = this.data.roles[l];
            abilities = this.getRoleAbilities(role);
            if (abilities.indexOf(ability) > -1) {
                // Ability is in role abilities
                return true;
            }
        }
        // We made it here, so the ability wasn't found in attached roles
        return false;
    }

    /**
     * Does current user have any of the required permission to do something?
     *
     * @param abilities [array]
     * @returns {boolean}
     */
    canAny(abilities) {
        this.resume();
        var role, roleAbilities;
        // Loop through roles
        var l = this.data.roles.length;
        var j = abilities.length;

        for (; l--;) {
            // Grab the the current role
            role = this.data.roles[l];
            roleAbilities = this.getRoleAbilities(role);

            for (; j--;) {
                if (roleAbilities.indexOf(abilities[j]) > -1) {
                    // Ability is in role abilities
                    return true;
                }
            }
        }
        // We made it here, so the ability wasn't found in attached roles
        return false;
    }

    /**
     * Persist data to storage based on config
     */
    private save() {
        switch (this.config.storage) {
            case 'sessionStorage':
                this.saveToStorage('sessionStorage');
                break;
            case 'localStorage':
                this.saveToStorage('localStorage');
                break;
            default:
                // Don't save
                return;
        }
    }

    /**
     * Persist data to web storage
     */
    private saveToStorage(storagetype) {
        window[storagetype]['setItem'](this.config.storageKey, JSON.stringify(this.data));
    }

    /**
     * Retrieve data from web storage
     */
    private fetchFromStorage(storagetype) {
        var data = window[storagetype]['getItem'](this.config.storageKey);
        return (data) ? JSON.parse(data) : false;
    }
}
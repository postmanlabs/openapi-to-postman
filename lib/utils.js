// this will have non-OAS-related utils

module.exports = {
  // merge userOptions over defaultOptions
  mergeOptions: function (defaultOptions, userOptions) {
    let retVal = {};

    for (let id in defaultOptions) {
      if (defaultOptions.hasOwnProperty(id)) {
        // set the default value to that option if the user has not defined
        if (userOptions[id] === undefined) {
          retVal[id] = defaultOptions[id].default;
          continue;
        }

        // check the type of the value of that option came from the user
        switch (defaultOptions[id].type) {
          case 'boolean':
            if (typeof userOptions[id] === defaultOptions[id].type) {
              retVal[id] = userOptions[id];
            }
            else {
              retVal[id] = defaultOptions[id].default;
            }
            break;
          case 'enum':
            if (defaultOptions[id].availableOptions.includes(userOptions[id])) {
              retVal[id] = userOptions[id];
            }
            else {
              retVal[id] = defaultOptions[id].default;
            }
            break;
          case 'array':
            // user input needs to be parsed
            retVal[id] = defaultOptions[id].default;
            try {
              retVal[id] = JSON.parse(userOptions[id]);

              // for valid JSON that's not an array, fallback to default
              (!Array.isArray(retVal[id])) && (retVal[id] = defaultOptions[id].default);
            }
            catch (e) {
              // user didn't provide valid JSON
              retVal[id] = defaultOptions[id].default;
            }
            break;
          default:
            retVal[id] = defaultOptions[id].default;
        }
      }
    }

    return retVal;
  },

  /**
   * Converts Title/Camel case to a space-separated string
   * @param {*} string - string in snake/camelCase
   * @returns {string} space-separated string
   */
  insertSpacesInName: function (string) {
    if (!string || (typeof string !== 'string')) {
      return '';
    }

    return string
      .replace(/([a-z])([A-Z])/g, '$1 $2') // convert createUser to create User
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // convert NASAMission to NASA Mission
      .replace(/(_+)([a-zA-Z0-9])/g, ' $2'); // convert create_user to create user
  }
};

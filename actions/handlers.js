var execute     = { };
var authetication_controller = require('./authentication_controller.js')

execute["/"] = authetication_controller.home
execute["/home"] = authetication_controller.home;
execute["/login"] = authetication_controller.login;
execute["/auth"] = authetication_controller.getLoggedInUser;

execute["/api/login"] = authetication_controller.apiLogin;
execute["/api/register"] = authetication_controller.apiRegister;
execute["/api/logout"] = authetication_controller.apiLogout;
execute["/api/grades"] = authetication_controller.getGrades;
execute["/api/users"] = authetication_controller.getUsers;

execute["/api/users/:id/grades"] = authetication_controller.getGradesOfUser

exports.execute = execute;
exports.controller = authetication_controller
var path = require("path");
var data = require('./../web/resources/data.json')
var fs = require('fs')
exports.home = function (request, response) {
    response.render(path.join(__dirname, "./../web/home.ejs"))
}

exports.login = function (request, response) {
    response.render(path.join(__dirname, "./../web/index.ejs"))
}
            
exports.getLoggedInUser = function (request, response) {
    if (request.session.uid == null) { 
        response.send({'message':'No user logged in'})
    } else {
        for (var i = 0; i < data["users"].length; i++) {
            user = data["users"][i];
            if (data["users"][i].id == request.session.uid) {
                response.send(user);
                break;
            }
        }
    }
}

exports.getGradesOfUser = function (request, response) {
    var id = request.params.id
    var has = true

    for (var i = 0; i < data["grades"].length; i++) {
        grades = data["grades"][i];
        if (grades["userid"] == id) {
            response.send(grades["courses"]);
            has = false
            break;
        }
    }

    if (has)
        response.send({"message": "Id does not exist"})
}

exports.getGradesOfUserOfACourse = function (request, response) {
    var id = request.params.id
    var course = request.params.course - 1
    var has = true
    for (var i = 0; i < data["grades"].length; i++) {
        grades = data["grades"][i];
        if (grades["userid"] == id) {
            response.send(grades["courses"][course]);
            has = false
            break;
        }
    }

    if (has)
        response.send({"message": "Id does not exist"})
}

exports.changeGrade = function(request, response) {
    var id = request.params.id
    var subject = request.params.name
    var grade = request.query.grade

    for (var i = 0; i < data["grades"].length; i++) {
        var grades = data["grades"][i];
        if (id == grades.userid) {
            break;
        }
    }

    if (grade == null || grade == undefined) {
        var has = true
        for (i = 0; i < grades["courses"].length; i++) {
            var course = grades["courses"][i]
            
            if(subject == course["name"]) {
                response.send(course)
                has = false
            }
        }
    
        if (has)
            response.send({"message": "Id does not exist"})
    } else {
        var edit = false
        for (i = 0; i < grades["courses"].length; i++) {
            var course = grades["courses"][i]
            if(subject == course["name"]) {
                course["grade"] = grade
                fs.writeFile('./web/resources/data.json',  JSON.stringify(data), function(err) {
                    if(err) {
                        return console.log(err);
                    }
                
                    console.log("The file was saved!");
                });
                edit = true
                response.send('Edited!')
            }
        }
    
        if (!edit) {
            var grade = {}
            grade["name"] = subject
            grade["grade"] = grade
            grades["courses"].push(grade)
            fs.writeFile('./web/resources/data.json',  JSON.stringify(data), function(err) {
                if(err) {
                    return console.log(err);
                }
            
                console.log("The file was saved!");
            });
            
            response.send('Added!')
        }
    }

}

exports.changeUsername = function (request, response) {
    var id = request.params.id
    
    var name = request.query.username

    var has = true;

    for (var i = 0; i < data["users"].length; i++) {
        var user = data["users"][i];
        if (id == user.id) {
            if(name == null || name == undefined) {
                response.send(user.username)
            } else {
                data["users"][i]["username"] = name;
                fs.writeFile('./web/resources/data.json',  JSON.stringify(data), function(err) {
                    if(err) {
                        return console.log(err);
                    }
                
                    console.log("The file was saved!");
                }); 
                
                response.send('Success!')
            }
            
            has = false
        }
    }

    if (has)
        response.send({"message": "Id does not exist"})
}

exports.apiRegister = function (request, response) {
    if (request.session.uid == null) { 
        var max = data["users"][0]["id"]
        for (var i = 1; i < data["users"].length; i++) {
            if(max < data["users"][i]["id"])
                max = data["users"][i]["id"]
        }
        
        var user = {}
        user["id"]  = max + 1;
        user["username"] = request.query.username;  
        user["password"] = request.query.password;

        if (user["username"] == "" || user["username"] == undefined || user["password"] == "" || user["password"] == undefined)
            response.send("Invalid username and password")
        else {        
            var passwordExists = false
            var usernameExists = false
            
            for (var i = 0; i < data["users"].length; i++) {
                if (user["username"] == data["users"][i]["username"]) {
                    usernameExists = true;
                } 
            }

            console.log(user)

            if (usernameExists) { 
                response.send("Username already exist!");
            } else {
                data["users"].push(user)
                var grades = {}
                grades["courses"] = {}
                grades["userid"] = user.id

                data["grades"].push(grades)
                
                fs.writeFile('./web/resources/data.json', JSON.stringify(data), function(err) {
                    if(err) {
                        return console.log(err);
                    }
                
                    console.log("The file was saved!");
                }); 
                response.send("Success");
            }
        }   
    } else {
        response.send("Already logged in!");
    } 
}

exports.apiLogin = function (request, response) {
    if (request.session.uid == null) { 
        var username = request.body.username;  
        var password = request.body.password;

        if (username == "" || username == undefined || password == "" || password == undefined)
            response.send("Invalid username and password")
        else {        
            var passwordExists = false
            var usernameExists = false
            var user = null
            for (var i = 0; i < data["users"].length; i++) {
                user = data["users"][i];
                if (user["username"] == username) {
                    usernameExists = true;
                } 

                if (user["password"] == password) {
                    passwordExists = true;
                }

                if (usernameExists && passwordExists) {
                    break;
                }
            }

            if (!usernameExists) { 
                response.send("Username does not exist!");
            } else if (!passwordExists) {
                response.send("Password incorrect!");
            } else {
                request.session.uid = user["id"];
                response.send("Success");
            }
        }   
    } else {
        response.send("Already logged in!");
    } 
}

exports.apiLogout = function (request, response) {
    request.session.uid = null;
    response.send("SUCCESS!")
}

exports.getGrades = function (request, response) {
    response.send(data["grades"])
}

exports.getUsers = function (request, response) {
    response.send(data["users"])
}


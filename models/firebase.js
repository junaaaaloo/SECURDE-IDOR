var firebase    = require('firebase');
var path        = require("path");

var serviceAccount  = require('../config/service-account-key.json');
var dbConfig        = require('../config/database.json');

firebase.initializeApp(dbConfig);

var utils       = require("./../utils/utils");

var emailService    = require('./email');
const notifier = require('node-notifier');

var orgs = [ ];
var orgsTS = null;
var orgsNum;
var users = [ ];
var usersTS = null;
var usersNum;
var submissions = [ ];
var subsNum;
var subsTS = null;

var database    = firebase.database();
var notifications = [];

exports.firebase = firebase;
exports.service = [];
exports.initialize = initialize;
/*
var mailOptions = {
  from: 'jonal_ticug@dlsu.edu.ph',
  to: 'sophia_rivera@dlsu.edu.ph',
  subject: 'Sending Email using Node.js',
  text: 'That was easy!'
};
*/
/*
notifier.notify({
    'title': 'APS Dashboard',
    'message': 'Hello, there!',
    'wait': true
});
*/

function initialize () {    
    database.ref('notifications').on('child_added', function(snapshot) {
        if(snapshot.val() != undefined || snapshot.val() != null) {
            notifications.push(snapshot.val());
            
            if(false == snapshot.val().email_sent) {
                database.ref('notifications').child(snapshot.key).child('email_sent').set(true);

                emailService.sendMail({
                    from: 'dlsucso.apsdashboard@gmail.com',
                    to: snapshot.val().email_list.split(','),
                    subject: '[APS Dashboard] ' + snapshot.val().title,
                    text: snapshot.val().message
                });

                notifier.notify({
                    'title': '[' + (new Date(snapshot.val().timestamp)).toLocaleString() + '] APS Dashboard - ' + snapshot.val().title,
                    'message': snapshot.val().message,
                    'wait': true
                });
            } 
        }
    });
    
    database.ref('notifications').on('child_removed', function(snapshot) {
        if(snapshot.val() != undefined || snapshot.val() != null) {
            delete notifications[snapshot.key];
        }
    });
    
    database.ref('orgs').on('value', function(snapshot){
        if(snapshot.val() != undefined || snapshot.val() != null) {
            console.log("[" + utils.toUTC(new Date()) + "] Updated the orgs.");
            orgs = snapshot.val();
            orgsTS = utils.toUTC(new Date());
            orgsNum = snapshot.numChildren();
        } else {
            console.log("[" + utils.toUTC(new Date()) + "] Orgs Access Error. " + 
            orgsTS==undefined||orgsTS==null?"No data will be loaded.":"Accessing data last " + orgsTS);
        }
    });

    database.ref('users').on('value', function(snapshot){
        if(snapshot.val() != undefined || snapshot.val() != null) {
            console.log("[" + utils.toUTC(new Date()) + "] Updated the users.");
            users = snapshot.val();
            usersTS = utils.toUTC(new Date());
            usersNum = snapshot.numChildren();
            
        } else {
            console.log("[" + utils.toUTC(new Date()) + "] Users Access Error. " +
            usersTS==undefined||usersTS==null?"No data will be loaded.":"Accessing data last " + usersTS);
        }
    });

    database.ref('submissions').on('value', function(snapshot){
        if(snapshot.val() != undefined || snapshot.val() != null) {
            console.log("[" + utils.toUTC(new Date()) + "] Updated the submissions.");
            submissions = snapshot.val();
            subsTS = utils.toUTC(new Date());
            subsNum = snapshot.numChildren();
        } else {
            console.log("[" + utils.toUTC(new Date()) + "] Submissions Access Error. " +
            subsTS==undefined||subsTS==null?"No data will be loaded.":"Accessing data last " + subsTS);
        }
    });
}

exports.service.countWeek = countWeek;

function countWeek () {
    var count = 0;

    for (key in submissions) {
        var d = new Date();
        d.setDate(d.getDate() - 7);
        d = d.toISOString().split('T')[0] + ' ' + d.toISOString().split('T')[1].substring(0,8);
        if(d < submissions[key].timestamp) 
            count++;
    }

    return count;
}

exports.service.countMonth = countMonth;

function countMonth () {
    var count = 0;
    
        for (key in submissions) {
            var d = new Date();
            d.setDate(d.getDate() - 30);
            d = d.toISOString().split('T')[0] + ' ' + d.toISOString().split('T')[1].substring(0,8);
            if(d < submissions[key].timestamp) 
                count++;
        }
    
        return count;
}

exports.service.getUserWithOrganization = getUserWithOrganization;

function getUserWithOrganization (userid) {
    var user = users[userid];
    if(user != null) {
        user.user_id = userid;
        user.org = getOrganization(user.org_id);
    }
    return user;
}


exports.service.getAllUsersWithOrganizations = getAllUsersWithOrganizations;

function getAllUsersWithOrganizations () {
    var usersT = users;
    
    for (key in usersT)
        usersT[key] = getUserWithOrganization(key);
    
    return usersT;
}

exports.service.getAllOrganizationsWithUsers = getAllOrganizationsWithUsers;

function getAllOrganizationsWithUsers () {
    var orgsT = orgs;
    
    for (key in orgsT)
        orgsT[key] = getOrganizationsWithUsers(key);
    
    return orgsT;
}

exports.service.getAllUsers = getAllUsers;

function getAllUsers () {
    return users;
}

exports.service.getUser = getUser;

function getUser (userid) {
    var user = users[userid];
    return user;
}

exports.service.getSubmission = getSubmission;

function getSubmission (docuID) {
    var submission = submissions[docuID];
    return submission;
}

exports.service.getCompleteSubmission = getCompleteSubmission;

function getCompleteSubmission (docuID) {
    var submission = submissions[docuID];
    submission.key = docuID;
    submission.submittedBy = getUserWithOrganization(submission.user_id_org); 
    submission.checker = getUser(submission.user_id_checker); 
    submission.org = getOrganization(submission.org_id);
    return submission;
}

exports.service.getAllCompleteSubmissions = getAllCompleteSubmissions;

function getAllCompleteSubmissions () {
    var completeSubmissions = {};
    for (key in submissions) {
        completeSubmissions[key] = getCompleteSubmission(key);
    }

    return completeSubmissions;
}

exports.service.getCompleteSubmissionsByOrg = getCompleteSubmissionsByOrg;

function getCompleteSubmissionsByOrg (orgid) {
    var completeSubmissions = {};
    for (key in submissions) {
        var sub = getCompleteSubmission(key);
        if(sub.org_id == orgid)                                             //version 3.6.7 fix
            completeSubmissions[key] = sub;
    }

    return completeSubmissions;
}

exports.service.getOrganizationsWithUsers = getOrganizationsWithUsers;

function getOrganizationsWithUsers(orgid) {
    var org = orgs[orgid];
    var count = 0;
    
    for (key in users) {
        if(users[key].org_id == orgid) {
            var user = users[key];
            count ++;
        }
    }
    
    org.user_count = count

    return org;
}

exports.service.findOrg = findOrg;

function findOrg(orgName, orgUsername) {
    
    for (key in orgs) {
        if(orgs[key].name == orgName || orgs[key].username == orgUsername) {
            return true;
        }
    }
    return false;
}

exports.service.findUser = findUser;

function findUser(userName, userUsername, userContact, userEmail) {
    
    for (key in users) {
        if(users[key].name == userName || 
            users[key].username == userUsername ||
            users[key].contact == userContact ||
            users[key].email == userEmail) {
            return true;
        }
    }
    return false;
}

exports.service.findUserByEmail = findUserByEmail;

function findUserByEmail(email) {
    
    for (key in users) {
        if(users[key].email == email) {
            return users[key];
        }
    }
    return false;
}

exports.service.findOrgByName = findOrgByName;

function findOrgByName(name) {
    
    for (key in orgs) {
        if(orgs[key].name == name) {
            return orgs[key];
        }
    }
    return false;
}

exports.service.findUserExist = findUserExist;

function findUserExist(userName, userUsername, userContact, userEmail, userKey) {
    
    for (key in users) {
        if((users[key].name == userName || 
            users[key].username == userUsername ||
            users[key].contact == userContact ||
            users[key].email == userEmail) && key != userKey) {
            return true;
        }
    }
    return false;
}

exports.service.getAllOrganizations = getAllOrganizations;

function getAllOrganizations() {
    return orgs;
}

exports.service.getOrganization = getOrganization;

function getOrganization (orgid) {
    var org = orgs[orgid];
    org.org_id = orgid;
    return org;
}

exports.service.loginUser = loginUser;

function loginUser (username, password) {
    var userTest = false, passTest = false;
    for (key in users) {
        if(users[key].username == username) {
            userTest = true;
            if(users[key].password == password) {
                return {test:true, user:getUserWithOrganization(key)};
            } return {test:true, user:null};
        }
    }

    return {test:false, user:null};
}

exports.service.countAcademic = countAcademic

function countAcademic (orgID) {
    var orgID = orgID || null, count = 0;
    
    for (key in submissions) {
        if(orgID == null || orgID == submissions[key].org_id) {
            if(submissions[key].act_nature.toUpperCase() == "ACADEMIC") {
                count++;
            }
        }
    }

    return count;
}

exports.service.countNonacademic = countNonacademic

function countNonacademic (orgID) {
    var orgID = orgID || null, count = 0;
    
    for (key in submissions) {
        if(orgID == null || orgID == submissions[key].org_id) {
            if(submissions[key].act_nature.toUpperCase() != "ACADEMIC") {
                count++;
            }
        }
    }

    return count;
}

exports.service.addOrganization = addOrganization;

function addOrganization(orgKey, orgDetails) {
    database.ref("orgs").child(orgKey).set({
        name: orgDetails.name,
        username: orgDetails.username,
        status: orgDetails.status,
        privilege: orgDetails.privilege
      });
}

exports.service.addUser = addUser;

function addUser (userDetails) {
    console.log("here");
    database.ref("users").child("user_"+(usersNum+1)).set({
        name: userDetails.name,
        username: userDetails.username,
        email: userDetails.email,
        contact: userDetails.contact,
        org_id: userDetails.org_id,
        password: userDetails.password
    });
}

exports.service.editUser = editUser;

function editUser (userID, userDetails) {
    database.ref("users").child(userID).update({
        name: userDetails.name,
        username: userDetails.username,
        email: userDetails.email,
        contact: userDetails.contact
    });
}

exports.service.changePassword = changePassword;

function changePassword(userID, newPassword) {
    database.ref("users").child(userID).update({
        password: newPassword
    });
}

exports.service.deleteUser = deleteUser;

function deleteUser (userID) {
    console.log("here delete");
    database.ref("users").child(userID).remove();
}

exports.service.countOrgs = countOrgs;

function countOrgs() {
    return orgsNum;
}

exports.service.countSubs = countSubs;

function countSubs() {
    return isNaN(subsNum)?-1:subsNum;
}

exports.service.changeOrgStatus = changeOrgStatus;

function changeOrgStatus(orgID, status) {
    var newStatus;
    if(status == 'inactive')
        newStatus = 'active';
    else if (status == 'active')
        newStatus = 'inactive';
    database.ref("orgs").child(orgID).update({
        status: newStatus
    });
}

exports.service.addSubmission = addSubmission;

function addSubmission(subKey, subDetails) {
    database.ref("submissions").child(subKey).set({
    act_date: subDetails.act_date,
    act_nature: subDetails.act_nature,
    act_time: subDetails.act_time,
    act_type: subDetails.act_type,
    act_venue: subDetails.act_venue,
    datetimechecked: "-",
    status: "-",
    sub_type: subDetails.sub_type,
    term: subDetails.term,
    timestamp: subDetails.timestamp,
    title: subDetails.act_title,
    type_sas: subDetails.type_sas,
    org_id: subDetails.org_id,
    user_id_checker: "-",
    user_id_org: subDetails.user_id_org
    });
    
    user_org = subDetails.user_id_org;
    emailUsers = [users[user_org].email];
    for (key in users) {
        if(getUserWithOrganization(key).org.privilege == 'admin')
            emailUsers.push(getUser(key).email);
    }

    addNotification({
        email_list: emailUsers.join(','),
        email_sent: false,

        message: users[subDetails.user_id_org].name +  " of " + 
            getUserWithOrganization(subDetails.user_id_org).org.name + 
            " added a new submission. \n \n" +
            "Activity Details \n" + 
            "Title: " + subDetails.act_title + '\n' +
            "Date and Time: " + subDetails.act_date + ' ' + subDetails.act_time + '\n' +
            "Term: " + subDetails.term + '\n' +
            "Venue: " + subDetails.act_venue + '\n' +
            "Nature: " + subDetails.act_nature + '\n' + 
            "Type: " + subDetails.act_type + '\n\n' +
            "Submission Details \n" + 
            "Type of Submission: " + subDetails.sub_type + '\n' +
            "Type Of SAS: " + subDetails.type_sas + '\n',
        timestamp: Date.now(),
        title: "New Submission: " + getUserWithOrganization(subDetails.user_id_org).org.name + ' - ' + subDetails.act_title,
        unread: true
    });
}

exports.service.checkSubmission = checkSubmission;

function checkSubmission(subKey, checkDetails) {
	user_org = submissions[subKey].user_id_org;
    emailUsers = [users[user_org].email];
    for (key in users) {
        if(getUserWithOrganization(key).org.privilege == 'admin')
            emailUsers.push(getUser(key).email);
    }
    
    var cur = utils.toUTC(new Date());
    
    addNotification({
        email_list: emailUsers.join(','),
        email_sent: false,
        message: users[checkDetails.checker].name +  " has checked the submission. \n" +
            "Activity Title: " + submissions[subKey].title + '\n' +
            "Checker: " + getUser(checkDetails.checker).name + ' at (' + cur + ')\n' + 
            "Remarks: " + checkDetails.remarks + '\n' +
            "Status: " + checkDetails.status,
        timestamp: (new Date()).toLocaleString(),
        title: "Checked Submission: " + getUserWithOrganization(checkDetails.checker).org.name + " - ",
        unread: true
    });
    
    database.ref("submissions").child(subKey).update({
        user_id_checker: checkDetails.checker,
        datetime_checked: cur,
        remarks: checkDetails.remarks,
        status: checkDetails.status
    });

    var date = new Date();
    var d = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().substring(0,19);
    database.ref("submissions").child(subKey).update({
        user_id_checker: checkDetails.checker,
        datetime_checked: d,
        remarks: checkDetails.remarks,
        status: checkDetails.status
    });
}

exports.service.addNotification = addNotification;

function addNotification (notification) {
    return database.ref("notifications").push(notification);
}

exports.service.deleteNotification = deleteNotification;

function deleteNotification (key) {
    return database.ref("notifications").child(key).set(null);
}

exports.service.deleteSubmission = deleteSubmission;

function deleteSubmission(subKey) {
    database.ref("submissions").child(subKey).remove();
}
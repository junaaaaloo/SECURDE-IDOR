$(document).ready(function(){
    $.ajax({
        url: 'auth',
    }).done(function(data){
        
        var user = data;
        $.ajax({
            url: 'api/users/' + user.id + '/username'
        }).done(function(data){
            $('#user').html('User: ' + data)
        })
        console.log(user.id)
        $.ajax({
            url: 'api/users/' + user.id + '/grades'
        }).done(function(data){
            $('#grades').html('')

            for (var i = 0; i < data.length; i++) {
                var row = document.createElement('tr');
                var course = document.createElement('td');
                var grade = document.createElement('td');
    
                course.innerText = data[i].name
                grade.innerText = data[i].grade
                
                row.append(course)
                row.append(grade)
    
                $('#grades').append(row)
            }
        })
    })

    $("#logout").click(function(){
        $.ajax({
            url: 'api/logout'
        }).done(function(data){
           window.location.href = '/login'


        })
    })

    $("#login").click(function(){
        $.ajax({
            url: 'api/login',
            method: 'POST',
            data: {
                'username': $('#username-field').val(),
                'password': $('#password-field').val()
            }
        }).done(function(data){
            console.log(data)

            if (data != 'Success') {

            } else {
                window.location.href = '/home'
            }


        })
    })
})
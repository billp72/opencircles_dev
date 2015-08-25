angular.module('mychat.controllers', [])

.controller('LoginCtrl', function ($scope, $ionicModal, $state, $firebaseAuth, Rooms, Users, $ionicLoading, $rootScope, SchoolDataService, schoolFormDataService, stripDot) {
    //console.log('Login Controller Initialized');

    var ref = new Firebase($scope.firebaseUrl);
    var auth = $firebaseAuth(ref);

    $scope.user = {};
    $scope.data = { "list" : '', "search" : ''};
   

    $scope.search = function() {

        schoolFormDataService.schoolList($scope.data.search).then(
            function(matches) {
                $scope.user.schoolID = matches[0];
                $scope.data.list = matches;
            }
        )
    }

    $scope.update = function(school){
        $scope.schoolInfo = school
        //$scope.selected = edu.domain;
           /* $scope.test = {
                txt: edu.selected.domain
            }  */   

    }
     function generatePass() {
        var possibleChars = ['abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?_-'];
        var password = '';
        for(var i = 0; i < 16; i += 1) {
            password += possibleChars[Math.floor(Math.random() * possibleChars.length)];
        }
        return password;
    }
     $scope.openModal = function(template){
        $ionicModal.fromTemplateUrl('templates/'+template+'.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.modal1 = modal;
            $scope.modal1.show();
        });
    }
    $scope.forgotPass = function(){
        $ionicModal.fromTemplateUrl('templates/forgotpass.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.modal2 = modal;
            $scope.modal2.show();
        });
    }
    $scope.forgotPassReset = function(enter){
        ref.resetPassword({
            email: enter.email
        }, function(error) {
            if (error) {
                switch (error.code) {
                    case "INVALID_USER":
                        alert("The specified user account does not exist.");
                        break;
                    default:
                        alert("Error resetting password:" + error);
                }
            } else {
                alert("Password reset. Email sent successfully!");
                $scope.modal2.hide();
                $scope.modal2.remove();
                $state.go('login');
            }
        });
    }
   
    $scope.verifyStudentEmail = function(enter){
        ref.resetPassword({
            email: enter.schoolemail
            }, function(error) {
                if (error) {
                    switch (error.code) {
                        case "INVALID_USER":
                            alert("The specified user account does not exist.");
                            break;
                        default:
                            alert("Error:" + error);
                        }
                } else {
                    alert("An email to your student account has been sent!");
                    $scope.modal3.hide();
                    $scope.modal3.remove();
                    $state.go('login');
                }
            });
    }
    $scope.createUser = function (user) {
        console.log("Create User Function called");
        if (user && user.email && user.password && user.displayname) {
            $ionicLoading.show({
                template: 'Signing Up...'
            });

            auth.$createUser({
                email: user.email,
                password: user.password
            }).then(function (userData) {
                alert("User created successfully!");
                ref.child("users").child(userData.uid).set({
                   user:{
                        email: user.email,
                        displayName: user.displayname
                    }
                });
                $ionicLoading.hide();
                $scope.modal1.hide();
                $scope.modal1.remove();
            }).catch(function (error) {
                alert("Error: " + error);
                $ionicLoading.hide();
            });
        } else
            alert("Please fill all details");
    }
    function emailEDUextention(email){
        var tolower = email.toLowerCase();
        return (/[.]/.exec(tolower)) ? /[^.]+$/.exec(tolower) : undefined;
    }
    $scope.createStudent = function (user) {
        console.log("Create Student Function called");
        if (user && user.schoolemail && /*emailEDUextention(user.schoolemail)[0] === 'edu' &&*/ user.displayname && !!$scope.schoolInfo) {
    
            $ionicLoading.show({
                template: 'Signing Up...'
            });
            auth.$createUser({
                email: user.schoolemail,
                password: generatePass()
            }).then(function (userData) {
                alert("User created successfully!");
                ref.child("users").child(userData.uid).set({
                    user:{
                        /*email: user.email,*/
                        displayName: user.displayname,
                        campus: user.campus,
                        schoolID: stripDot.strip($scope.schoolInfo.domain),
                        schoolEmail: user.schoolemail

                    }
                });
                $ionicLoading.hide();
                $scope.modal1.hide();
                $scope.modal1.remove();
            }).then(function(userData){
                    var school = Rooms.getSchoolBySchoolID(stripDot.strip($scope.schoolInfo.domain));
                    school.$loaded(function(data){
                        if(data.length <= 0){
                            //var room = ref.child("schools").push();
                            var room = ref.child("schools").child(stripDot.strip($scope.schoolInfo.domain));
                            room.set({
                                icon: "ion-university",
                                schoolname: $scope.schoolInfo.name,
                                schoolID: stripDot.strip($scope.schoolInfo.domain),
                                ID: room.key()
                            },function(err){
                                if(err) throw err;

                            })
                        }
                    });
            }).then(function(){
                 $ionicModal.fromTemplateUrl('templates/verifyStudentEmail.html', {
                    scope: $scope
                }).then(function (modal) {
                    $scope.modal3 = modal;
                    $scope.modal3.show();
                });
              })  
            .catch(function (error) {
                alert("Error: " + error);
                $ionicLoading.hide();
            });
        } else
            alert("Please fill all details properly");
    }
    $scope.signIn = function (user) {
        
        if (user && user.email && user.pwdForLogin) {
            $ionicLoading.show({
                template: 'Signing In...'
            });
            auth.$authWithPassword({
                email: user.email,
                password: user.pwdForLogin
            }).then(function (authData) {
                console.log("Logged in as:" + authData.uid);
                ref.child("users").child(authData.uid+'/user').once('value', function (snapshot) {
                    var val = snapshot.val();
    
                    if(!!val.schoolID){
                        $rootScope.advisor   = true;
                        $rootScope.prospect  = false;
                        $rootScope.schoolID  = val.schoolID;
                        //persist data
                        Users.storeIDS(true, 'advisor');
                        Users.removeItem('prospect');
                        Users.storeIDS(val.schoolID, 'schoolID');
                    }else{
                        $rootScope.prospect = true;
                        $rootScope.advisor   = false;
                        $rootScope.schoolID  = '';
                        //persist data
                        Users.storeIDS(true, 'prospect');
                        Users.removeItem('advisor');
                        Users.removeItem('schoolID');

                    }
                    $rootScope.userID = authData.uid;
                    $rootScope.displayName = val.displayName;
                    //persist data
                    Users.storeIDS(authData.uid, 'userID');
                    Users.storeIDS(val.displayName, 'displayName');
                
                    $ionicLoading.hide();
                    if(!!val.schoolID){
                        $state.go('menu.tab.student', {
                            schoolID: val.schoolID
                        });
                    }else{
                        $state.go('menu.tab.ask');
                    }
                    
                });
                
            }).catch(function (error) {
                alert("Authentication failed:" + error.message);
                $ionicLoading.hide();
            });
        } else
            alert("Please enter email and password both");
    }
    
})
.controller('TabCtrl', function ($scope){
    $scope.tabSelected = function (select){
        $scope.tabs = select;
    }
})
.controller('SettingsCtrl', function ($scope, Users, ChangePassword, $state, $ionicLoading, $ionicModal, Auth) {
    console.log('settings initialized');

    $scope.deleteAccount = function(){
                $ionicModal.fromTemplateUrl('templates/delete-account.html', {
                    scope: $scope
                }).then(function (modal) {
                    $scope.modal = modal;
                    $scope.modal.show();
            });
        }

    $scope.logout = function () {
            console.log("Logging out from the app");
            $ionicLoading.show({
                template: 'Logging Out...'
            });
            //$scope = $scope.$new(true);
            Auth.$unauth();
    }
       
    $scope.runChangePassword = function(user){
            ChangePassword.change(user);
    }
})
/*
* opens the private chat room
*/
.controller('ChatCtrl', function ($scope, $rootScope, Chats, Users, $state, $window, $ionicLoading, $ionicModal) {
    //console.log("Chat Controller initialized");
    if(!$scope.schoolID){
        $scope.schoolID = Users.getIDS('schoolID');
    }
    if(!$scope.displayName){
        $scope.displayName = Users.getIDS('displayName');
    }
    $scope.IM = {
        textMessage: ""
    };
    var toggleUserID     = '',
        toggleQuestionID = '';
    //$scope.students = [];
    var advisorKey          = $state.params.advisorKey,
        schoolID            = $state.params.schoolID != 'false' ? $state.params.schoolID : $scope.schoolID,
        advisorID           = $state.params.advisorID,
        prospectUserID      = $state.params.prospectUserID,
        prospectQuestionID  = $state.params.prospectQuestionID,
        indicatorToggle     = $state.params.indicatorToggle;

        if(!!$scope.schoolID){
            toggleUserID     = $state.params.prospectUserID,
            toggleQuestionID = $state.params.prospectQuestionID
        }else{
            toggleUserID     = advisorID,
            toggleQuestionID = advisorKey;
        }

        $scope.question  = $state.params.question;

    Chats.selectRoom(schoolID, advisorID, advisorKey);

    var roomName = Chats.getSelectedRoomName();

    // Fetching Chat Records only if a Room is Selected
    if (roomName) {
        $scope.roomName = " - " + roomName;
        $scope.chats = Chats.all($scope.displayName);
            $rootScope.$on('message.sent', function (event, value){
                $scope.usersName = value;
            })
            $scope.$watch('chats', function(newValue, oldValue){
                if(newValue){
                    if(!!$scope.usersName){
                        if($scope.usersName !== $scope.displayName){
                            navigator.notification.vibrate(500);
                        }
                    }
                }
            },true);
            
    }

    $scope.sendMessage = function (msg) {
        Chats.send($scope.displayName, $scope.schoolID, msg, toggleUserID, toggleQuestionID, indicatorToggle);
        $scope.IM.textMessage = "";
    }
//removes a single chat message
    $scope.remove = function (chat, index) {
        Chats.remove(chat);
    }
//remove question/conversation once dialog is confirmed
    $scope.removePerm = function () {
       var val = Chats.wrapitup(advisorKey, advisorID, prospectQuestionID, prospectUserID);
       if(typeof val !== "string"){
            if(!!$scope.schoolID){
                $scope.modal.hide();
                $state.go('menu.tab.student', {
                    schoolID: $scope.schoolID
                });
            }else{
                 $scope.modal.hide();
                 $state.go('menu.tab.ask');
            }
       }
    }
//dialog that warns user before question/conversation is deleted
    $scope.removeConversation = function (){
        $ionicModal.fromTemplateUrl('templates/remove-conversation.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.modal = modal;
            $scope.modal.show();
        });
    }

})
/*this is the prospects view room
*
*/
.controller('ProspectCtrl', function ($scope, Users, $state) {
    console.log("Rooms Controller initialized");
    if(!$scope.userID){
        $scope.userID = Users.getIDS('userID');
    }

    var q = Users.getUserByID($scope.userID);
    q.$loaded(function(data){
        $scope.rooms = data;
    })
    
    $scope.openChatRoom = function (advisorID, schoolID, question, advisorKey, prospectQuestionID) {
        
        if(!!advisorID){
            $state.go('menu.tab.chat', {
                advisorID: advisorID,
                schoolID: schoolID,
                indicatorToggle:true,
                question: question,
                advisorKey: advisorKey,
                prospectUserID: $scope.userID, //
                prospectQuestionID: prospectQuestionID //
            });
            //TODO: toggle conversationStarted to false
        }else{
            alert('question has not been answered yet');
        }
    }
})
/*the advisor see private questions and open chat
*
*/
.controller('AdvisorConversationsCtrl', function ($scope, $rootScope, Users, Chats, Rooms, /*Store,*/ $state, $window) {
    console.log("Student conversations Controller initialized");
    if(!$scope.userID){
        $scope.userID = Users.getIDS('userID');
    }
    if(!$scope.schoolID){
        $scope.schoolID = Users.getIDS('schoolID');
    }
    $scope.school = Users.getUserByID($scope.userID);
    $scope.school.$loaded(function(data){
         $scope.rooms = data;
         
     });
    $scope.openChatRoom = function (question, advisorKey, prospectUserID, prospectQuestionID) {
        //TODO: toggle conversationStarted to false
        $state.go('menu.tab.chat', {
            advisorID: $scope.userID,
            schoolID: false,
            indicatorToggle:true,
            question: question,
            advisorKey: advisorKey,
            prospectUserID: prospectUserID,
            prospectQuestionID: prospectQuestionID  
        });
    }
})


/*asnswer questions controller - opened from public pool: StudentCtrl
*
*/
.controller('AnswerCtrl', function ($scope, Rooms, Users, $state, $ionicLoading) {
    console.log("Answer Controller initialized");
    //console.log("Chat Controller initialized");
    if(!$scope.schoolID){
        $scope.schoolID = Users.getIDS('schoolID');
    }
    if(!$scope.displayName){
        $scope.displayName = Users.getIDS('displayName');
    }
    $scope.IM = {
        textMessage: ""
    };
    var questionID = $state.params.questionID, //ID of the question in schools
        schoolID = $state.params.schoolID,
        advisorID = $state.params.advisorID,
        indicatorToggle = $state.params.indicatorToggle;
        $scope.question = $state.params.question;
        $scope.user = {};
    $scope.answer = function (msg) {
      var chars = !!msg.answer ? msg.answer.split('') : undefined;

      if(chars && chars.length >= 15){
            $ionicLoading.show({
                template: 'Sending...'
            });
            var advisorKey='';
            var question = Rooms.retrieveSingleQuestion(schoolID, questionID);
                question.$loaded(function(data){
                    Users.addQuestionToUser(
                        schoolID,
                        advisorID,
                        $scope.question,
                        'ion-chatbubbles', 
                        data.questionID, //prospects question ID TODO: same as below
                        data.userID //prospects ID TODO: get this and pass it as a param
                    )
                    .then(function (questionData){
                        advisorKey = questionData.key();
                        Users.addAnswerToAdvisor(
                            $scope.displayName,
                            schoolID,
                            msg.answer,
                            questionData.key(),
                            advisorID
                        )
                        .then(function (advisorData){
                            Users.updateProspectQuestion(
                                data.userID, 
                                data.questionID, 
                                advisorID, 
                                advisorKey,
                                question,
                                questionID,
                                schoolID
                            ) 
                            $ionicLoading.hide();
                            $state.go('menu.tab.studentc');
                            $scope.user.answer = '';
                        })
                    });
                });

        }else{
            alert('questions must be at least 15 characters long');
        }
    }
})
/*this controller is for public questions
*
*/
.controller('AdvisorCtrl', function ($scope, $rootScope, Users, Chats, Rooms, $state, $window) {
    console.log("Student Controller initialized");
    if(!$scope.userID){
        $scope.userID = Users.getIDS('userID');
    }
    $scope.school = Rooms.getSchoolBySchoolID($state.params.schoolID);
    $scope.school.$loaded(function(data){
         $scope.rooms = data;
     });
    $scope.openAnswerQuestion = function (schoolID, questionID, userID, question) {

        $state.go('menu.tab.answer', {
            advisorID: $scope.userID,
            schoolID: schoolID,
            questionID: questionID,
            prospectID: userID,
            indicatorToggle:false,
            question: question
        });
    }
   
})
/*the prospect can ask a question
*
*/
.controller('AskCtrl', function($scope, $state, Users, Rooms, SchoolDataService, stripDot, $ionicLoading){
    var icon='';
    if(!$scope.userID){
        $scope.userID = Users.getIDS('userID');
    }

    $scope.user = {}
    $scope.data = { 'list' : '', 'search' : ''};

    $scope.search = function() {

        SchoolDataService.searchSchools($scope.data.search).then(
            function(matches) {
                $scope.user.schoolID = matches[0];
                $scope.data.list = matches;
                
            }
        )
    }
    $scope.update = function (data){

    }
    $scope.ask = function (quest){

        var chars = !!quest.question ? quest.question.split('') : undefined;
            if(!!quest.schoolID){
                if(chars && chars.length >= 15){
                    $ionicLoading.show({
                        template: 'Sending...'
                    });
                     Users.addQuestionToUser(
                            quest.schoolID.schoolID, 
                            $scope.userID, 
                            quest.question,
                            'ion-chatbubbles',
                            false,
                            false
                        ).then(function(data){
                            Rooms.addQuestionsToSchool(
                                quest.schoolID.schoolID, 
                                $scope.userID,
                                quest.question,
                                'ion-chatbubbles', 
                                data.key() 
                        ).then(function(){
                            $ionicLoading.hide();
                            $state.go('menu.tab.newest');
                            $scope.data.search = '';
                            $scope.user.question = '';
                        });
                    })
                }else{
                    alert('questions must be at least 15 characters long');
                }
            }else{
                alert('please select a school');
            }
    }
});

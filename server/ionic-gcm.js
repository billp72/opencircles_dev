//
var 
    express = require('express'),
    gcm = require('node-gcm'),
    apn = require('apn'),
    bodyParser = require('body-parser'),
    Firebase = require('firebase'),
    app = express(),
    ref = new Firebase('https://incandescent-torch-5679.firebaseio.com/push_notifications');


app.set('port', (process.env.PORT || 5000));

//app.use(express.static(__dirname + '/public'));

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use(function(req, res, next){
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// views is directory for all template files
//app.set('views', __dirname + '/views');
//app.set('view engine', 'ejs');

//app.get('/', function(request, response) {
    //response.render('pages/index');
//});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});


app.post('/register', function(req, res){
    var 
        device_token = req.body.device_token,
        device_type  = req.body.device_type,
        userID       = req.body.userID;

        ref.once('value', function(snapshot){
            if(!snapshot.hasChild(device_token)){
                ref.child(userID).set({'deviceToken': device_token, 'deviceType': device_type});
            }
        });

    res.send('ok');
});

app.get('/push', function(req, res){

    ref.child(req.query.userID).on('value', function(snapshot) {
        var val = snapshot.val();
      
        if(val.deviceType === 'android'){
            var 
                device_tokens = [], //create array for storing device tokens
                retry_times = 4, //the number of times to retry sending the message if it failed
                sender = new gcm.Sender('AIzaSyAbXzuAUk1EICCdfpZhoA6-TleQrPWxJuI'), //create a new sender
                message = new gcm.Message(); //create a new message

                message.addData('title', 'Open Circles');
                message.addData('message', req.query.message);
                message.addData('sound', 'notification');

                message.collapseKey = 'testing'; //grouping messages
                message.delayWhileIdle = true; //delay sending while receiving device is offline
                message.timeToLive = 3; //the number of seconds to keep the message on the server if the device is offline

                device_tokens.push(val.deviceToken);

                sender.send(message, device_tokens, retry_times, function(result){
                    console.log(result);
                    console.log('push sent to: ' + val.deviceToken);
                });
        }else if(val.deviceType === 'ios'){
            var 
                options = { },
                apnConnection = new apn.Connection(options),
                device = new apn.Device(val.deviceToken),
                note = new apn.Notification();

                note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                note.badge = 3;
                note.sound = "ping.aiff";
                note.alert = "\uD83D\uDCE7 \u2709 You have a new message";
                note.payload = {'message': req.query.message};

                apnConnection.pushNotification(note, device);
        }

    });
    res.send('ok');
});

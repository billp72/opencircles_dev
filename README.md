#open circles development
note you must have node/npm installed

(see instructions here to do the following and run locally: http://cordova.apache.org/docs/en/5.0.0/guide_cli_index.md.html)

1) install phonegap
2) create a phonegap project
3) clone this repository in to the folder
4) install platforms (see link above)
5) install plugins (See link. currrently I have: com-ionic-keyboard, cordova-plugin-console, cordova-plugin-device, cordova-plugin-splashscreen, cordova-plugin-vibration, cordova-plugin-whitelist)

1) type: "adb start-server" (you should see two lines that it's started)
2) use a usb or firewire cable to connect your mobile phone to you laptop
(make sure 'debug mode' is enabled on your mobile device before you connect it to your computer)
3) type: "cordova run android"  - or ios depending on your system

the last step will build and install the app on your device. If the emulator pups up (you'll see a command-looking box that says emulator) type: "adb kill-server" then unplug your device type "adb start-server" replug your device back in and rerun the build. It may take a few times before it opens the app on the phone, be patient.

Once you've built your app the first time, you can simply run "phonegap run android/ios" from their on out unless you make changes to plugins, platforms, config.xml or other internal java or config files. All css, js, html and most everything in www folder does not require a rebuild
# Muzzley JS Lib Changelog

2015-03-19: Version 0.5.4

    * Fixed another multiple parallel connections on timeout. 

2015-03-11: Version 0.5.3

    * Fixed case where `connect` event was emitted multiple times.
    * Fixed multiple parallel connections on timeout. 

2015-02-13: Version 0.5.2

    * Fixed reconnection event when reconnecting without any active subscription.
    * Replying to server heartbeats with a heartbeat.

2015-01-02: Version 0.5.1

    * Fixed RPC responses with primitive data.
    * Added new app/manager id and auth token authentication.
    * Improved reconnection logic.
    * Other bugfixes.

2014-11-17: Version 0.5.0

    * Implemented multi-channel communication.
    * Implemented Pub/Sub communication.

2014-10-30: Version 0.4.2

    * Fixed `connect` trigger when connection is only successful after a reconnect.

2014-10-17: Version 0.4.1

    * Fixed `connectApp()` backward compatibility.

2014-10-17: Version 0.4.0

    * The library must now be instantiated.
    * Added many events such as 'connect', 'reconnect', etc.
    * Added idling detection and respective reconnection logic.

2014-10-15: Version 0.3.9

    * Repackaged the npm module because it contained unnecessary files.

2014-04-15: Version 0.3.8

    * Fixed an issue that prevented multiple user connections.

2014-04-08: Version 0.3.7

    * Added support for the `deviceId` property in the handshake process.

2014-04-04: Version 0.3.6

    * Fixed an issue that prevented participants to be correctly notified of file sharing invitations.

2013-10-02: Version 0.3.5

    * Experimental: Added support for SSL in the browser (HTTPS) and in Node.js (WSS).
    * Implemented the `activityTerminated` event for participants.
    * Implemented a way to manually trigger the `ready` protocol message.
    * Added a way to `.quit()` activities and participations.
    * Added reconnection attempts for port 2080 if port 80 fails.

2013-07-05: Version 0.3.4

    * Bumped browserify dependency because of a `npm install`-related issue.

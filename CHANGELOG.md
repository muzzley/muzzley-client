# Muzzley JS Lib Changelog

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

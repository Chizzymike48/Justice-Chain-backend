# Live Streaming Feature Guide

## Overview
The JusticeChain platform now includes a complete live streaming feature with:
- **Live Camera Feed** - Broadcast directly from your device
- **Live Chat** - Real-time communication with viewers
- **Live Location Tracking** - Show geographic coordinates of the broadcast
- **Viewer Count** - Monitor engagement in real-time

## How to Use

### Starting a Live Stream

1. **Navigate to the Livestreams Page**
   - Go to the "🌍 Explore" dropdown in the navbar
   - Click "Live Streams" (or manually go to `/livestreams`)

2. **Click the "● Go Live" Button**
   - This is the red button in the top right of the page (only visible when logged in)
   - A modal will appear asking for:
     - **Stream Title**: Name of your broadcast
     - **Related Case ID**: (Optional) Link to a specific report

3. **Grant Permissions**
   - Your browser will ask for camera and microphone access
   - Click "Allow" to enable streaming
   - Location permission will also be requested for GPS tracking

4. **Camera & Location Status**
   - The camera feed will display in real-time
   - Your current location (latitude/longitude) shows on the left sidebar
   - Location updates continuously as you move

5. **Start Broadcasting**
   - Click the green "✓ Start Live Stream" button
   - Your stream is now live and visible to all users
   - A red "LIVE" indicator appears on the video feed

6. **Live Chat Sidebar**
   - View all messages from viewers in real-time
   - Send messages to engage with your audience
   - Admin and investigator messages are highlighted in orange

7. **Stop Streaming**
   - Click the red "⏹ Stop Streaming" button when done
   - Your stream ends immediately
   - You return to the main livestreams page

## Features

### Camera Feed
- **Resolution**: Up to 1280×720 automatically (adapts to device)
- **Format**: Mirrored view (like looking in a mirror)
- **Audio**: Microphone enabled for live commentary
- **Fallback**: Shows error message if camera access is denied

### Live Chat
- **Connection Status**: Green dot shows active connection
- **Message Count**: Shows total messages in stream
- **User Roles**: Admins/Investigators identified with orange names
- **Timestamps**: Every message shows when it was sent
- **Auto-scroll**: Chat automatically scrolls to latest messages

### Location Tracking
- **Real-time GPS**: Updates as you move
- **Accuracy Indicator**: Shows GPS precision (±X meters)
- **Safety Note**: Coordinates help viewers verify authenticity

### Stream Recording
- Streams are recorded in JusticeChain database
- Stream URL (rtmp://...) created automatically
- Linked to your user account

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Camera  | ✅     | ✅      | ⚠️     | ✅   |
| Audio   | ✅     | ✅      | ⚠️     | ✅   |
| Location| ✅ HTTPS| ✅ HTTPS| ✅ HTTPS| ✅ HTTPS|
| WebSocket| ✅    | ✅      | ✅     | ✅   |

**Note**: HTTPS is required for camera/location access on production servers.

## Technical Requirements

### Frontend Requirements
- Modern browser with WebRTC support
- Microphone and camera hardware
- Stable internet connection (minimum 2 Mbps recommended)
- HTTPS connection (for production)

### Backend Requirements
- Socket.IO running on port 5000
- MongoDB for stream recording
- Redis for real-time messaging (optional but recommended)

## Troubleshooting

### Camera not working
1. Check browser permissions (Settings > Privacy > Camera)
2. Try a different browser
3. Restart the browser
4. Check that no other app is using the camera

### Location not available
1. Enable location services on your device
2. Check browser location permissions
3. Allow JusticeChain to access location
4. May take a few seconds to acquire GPS signal

### Chat messages not sending
1. Check internet connection
2. Verify you're logged in
3. Look for green connection indicator in chat header
4. Try refreshing the page

### Stream not appearing for others
1. Check that status is set to "active"
2. Verify stream URL is valid
3. Check browser console for errors
4. Restart the backend service

## Best Practices

### Before Going Live
- Test camera and microphone
- Check internet speed
- Have a clear title for your broadcast
- Ensure good lighting
- Check location privacy settings

### During Broadcasting
- Speak clearly
- Keep camera steady
- Monitor chat for important questions
- Update description if needed
- Watch viewer count in sidebar

### After Broadcasting
- Stop the stream properly
- Review chat conversation
- Archive important clips
- Share stream link with relevant parties

## Privacy & Safety

### Data Protection
- Streams are encrypted in transit
- Location data only visible during active stream
- Chat messages temporarily cached, not permanently stored
- User information protected per privacy policy

### Location Privacy
- Only shared during active broadcast
- Automatically disabled when stream ends
- GPS accuracy intentionally shown (transparency)
- No location history stored

### Content Moderation
- Admins can monitor live chat
- Report inappropriate messages during stream
- Stream can be ended by moderators if needed
- Content guidelines apply to all broadcasts

## API Integration

### Socket Events
```javascript
// Join a livestream
socket.emit('livestream:join', {
  streamId: 'unique-stream-id',
  caseId: 'optional-case-id',
  userId: 'user-id',
  username: 'username'
})

// Send a message
socket.emit('livestream:message', {
  id: 'message-id',
  username: 'username',
  message: 'message-text',
  timestamp: Date.now(),
  role: 'optional-role'
})

// Leave stream
socket.emit('livestream:leave', {
  streamId: 'stream-id',
  username: 'username'
})
```

### REST Endpoints
- `GET /api/v1/livestream` - List all streams
- `GET /api/v1/livestream/:id` - Get stream details
- `POST /api/v1/livestream` - Create new stream (authenticated)

## Support

For issues or feature requests:
1. Check troubleshooting section above
2. Review browser console for error messages
3. Contact platform administrators
4. Submit issue on GitHub repository

---

Last Updated: March 2026
Version: 1.0

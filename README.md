# Jovo Plugin for Voice CMS

The Jovo Plugin for Voice CMS, an open source content management system for voice apps.

Voice CMS can be found here: https://github.com/pialuna/voice-cms
![Voice CMS](https://raw.githubusercontent.com/pialuna/voice-cms/main/docs/voice-cms.png)


## Plugin installation
```bash
npm install --save jovo-plugin-voicecms
```

In `src/app.js` in your Jovo project:
```javascript
const { VoiceCMS } = require('jovo-plugin-voicecms');
```
```javascript
app.use(
	new VoiceCMS({ 
		endpoint: "http://localhost:1234", // Your endpoint of the Voice CMS API
		projectId: "604bda3b3d03e334b6a6a33f" // The id of the project in the Voice CMS
	})
);
```

## Usage

In your Jovo app logic, you can now access a content item via its key, that is composed like this: `<CollectionName>.<key>.<ColumnName>`

```javascript
this.$speech.addAudio(this.t('Sound.intro.soundbank_url'));

this.$speech.addText(this.t('Responses.welcome.response'));

this.ask(this.$speech);
```

A sample Jovo quiz game app, which uses the Voice CMS Plugin, can be found here:
https://github.com/pialuna/jovo-sample-app-voicecms

import { Button, Input, Typography } from '@mui/material';
import React, { useState } from 'react';
import { readSettings, saveSettings } from '../helpers/settings';

function SettingsRow(props) {
  //Todo: this could look better. Maybe a groupbox-type view?
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 10}}>
      <Typography>{props.displayName}</Typography>
      <Input sx={{flexGrow: 1}} onChange={props.onChange} value={props.value}/>
    </div>
  )
}

export function SettingsView() {
  const [modifiedSettings, setModifiedSettings] = useState(readSettings());

  const handleSettingChange = (name, e) => {
    setModifiedSettings({...modifiedSettings, [name]: e.target.value});
  }


  const saveChanges = () => {
    if (!modifiedSettings.todoistApiKey) {
      alert('API Key is required for this application');
      return;
    }

    saveSettings(modifiedSettings);
    window.location.reload();
  }

  return (
    <React.Fragment>
      <div style={{width: 'calc(100% - 30px)', height: '100%', display: 'flex', flexDirection: 'column', padding: 15}}>
        <Typography variant='h4' sx={{alignSelf: 'center'}}>Settings</Typography>
        <SettingsRow displayName='Todoist API Key' value={modifiedSettings.todoistApiKey} onChange={e => handleSettingChange('todoistApiKey', e)}/>{/*Todo: this should be an "auth todoist" button that follows the auth flow: https://developer.todoist.com/guides/#authorization*/}
        <SettingsRow displayName='Task filter' value={modifiedSettings.taskFilter} onChange={e => handleSettingChange('taskFilter', e)}/>
        <SettingsRow displayName='"Today" label to apply' value={modifiedSettings.todayLabel} onChange={e => handleSettingChange('todayLabel', e)}/>
        <SettingsRow displayName='"Tomorrow" label to apply' value={modifiedSettings.tomorrowLabel} onChange={e => handleSettingChange('tomorrowLabel', e)}/>
        <SettingsRow displayName='"Other" label to apply' value={modifiedSettings.otherLabel} onChange={e => handleSettingChange('otherLabel', e)}/>
        <Button variant='contained' sx={{marginTop: 'auto'}} onClick={saveChanges}>Save</Button>
        <div style={{display: 'grid', marginTop: 5, gridTemplateColumns: 'auto auto', gap: 10}}>
          {/*Todo: tweak the styles here - they're not the best (they also don't look great on different screen sizes - the images should probably have a fixed ratio)*/}
          <a href='https://github.com/derekantrican/Todoist-Planner' target='_blank' rel='noreferrer'>
            <img height='36' style={{border: 0, borderRadius: 10, height: 36, width: '100%'}} src='https://i.imgur.com/Y7LVELD.png' border='0' alt='GitHub Repository' />
          </a>
          <a href='https://ko-fi.com/E1E5RZJY' target='_blank' rel='noreferrer'>
            <img height='36' style={{border: 0, height: 36, width: '100%'}} src='https://storage.ko-fi.com/cdn/kofi2.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' />
          </a>
        </div>
      </div>
    </React.Fragment>
  );
}
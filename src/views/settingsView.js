import { Button, Input, Typography } from '@mui/material';
import React from 'react';

function SettingsRow(props) {
  //Todo: this could look better. Maybe a groupbox-type view?
  //Todo: need to set value
  //Todo: need to handle updating value in settings object
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 10}}>
      <Typography>{props.displayName}</Typography>
      <Input sx={{flexGrow: 1}} onChange={props.onChange}/>
    </div>
  )
}

export function SettingsView() {
  const saveSettings = () => {
    //Todo: update values in local storage (and refresh page?)
  }

  return (
    <React.Fragment>
      <div style={{width: 'calc(100% - 30px)', height: '100%', display: 'flex', flexDirection: 'column', padding: 15}}>
        <Typography variant='h4' sx={{alignSelf: 'center'}}>Settings</Typography>
        <SettingsRow displayName='Todoist API Key' onChange={e => console.log(e.target.value)}/>{/*Todo: this should be an "auth todoist" button that follows the auth flow: https://developer.todoist.com/guides/#authorization*/}
        <SettingsRow displayName='Task filter'/>
        <SettingsRow displayName='"Today" label to apply'/>
        <SettingsRow displayName='"Tomorrow" label to apply'/>
        <SettingsRow displayName='"Other" label to apply'/>
        <Button variant='contained' sx={{marginTop: 'auto'}} onClick={saveSettings}>Save</Button>
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
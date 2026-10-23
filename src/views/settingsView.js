import { Button, IconButton, InputAdornment, Link, Paper, Stack, TextField, Typography } from '@mui/material';
import React, { useState } from 'react';
import { readSettings, saveSettings } from '../helpers/settings';

function SettingsSection(props) {
  return (
    <Paper variant='outlined' sx={{padding: 2, borderRadius: 3}}>
      <Stack spacing={2}>
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <i style={{fontSize: 18, opacity: 0.8}} className={`bi bi-${props.icon}`}/>
          <Typography variant='subtitle1' sx={{fontWeight: 600}}>{props.title}</Typography>
          {props.optional ? <Typography variant='subtitle1' color='text.secondary'>(optional)</Typography> : null}
        </div>
        {props.children}
      </Stack>
    </Paper>
  );
}

function LabelSettingField(props) {
  return (
    <TextField label={props.label} placeholder='No label' size='small' fullWidth value={props.value} onChange={props.onChange}
      slotProps={{input: {startAdornment: (
        <InputAdornment position='start'>
          <i style={{color: props.color}} className='bi bi-tag-fill'/>
        </InputAdornment>
      )}}}/>
  );
}

export function SettingsView() {
  const [modifiedSettings, setModifiedSettings] = useState(readSettings());
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  const handleSettingChange = (name, e) => {
    setModifiedSettings({...modifiedSettings, [name]: e.target.value});
  }

  const saveChanges = (e) => {
    e.preventDefault();

    if (!modifiedSettings.todoistApiKey) {
      setApiKeyMissing(true);
      return;
    }

    saveSettings(modifiedSettings);
    window.location.href = window.location.pathname.replace(/\/settings\/?$/, '/'); //Reload into the planner (leaving /settings if we came from there)
  }

  return (
    <form onSubmit={saveChanges} style={{height: '100%', overflowY: 'auto'}}>
      <Stack spacing={2} sx={{maxWidth: 480, minHeight: '100%', margin: '0 auto', boxSizing: 'border-box' /*No padding: the app's screen margin already pads this view*/}}>
        <div style={{textAlign: 'center', paddingTop: 16, paddingBottom: 8}}>
          <i style={{fontSize: 48, color: '#e44332'}} className='bi bi-calendar2-check'/>
          <Typography variant='h4' sx={{fontWeight: 600}}>Todoist Planner</Typography>
          <Typography color='text.secondary' sx={{margin: '0 40px'}}>Quickly triage your tasks so you know what to focus on</Typography>
        </div>

        <SettingsSection title='Connect to Todoist'>
          {/*Todo: this should be an "auth todoist" button that follows the auth flow: https://developer.todoist.com/guides/#authorization*/}
          <TextField label='API token' size='small' fullWidth autoComplete='off'
            type={showApiKey ? 'text' : 'password'}
            value={modifiedSettings.todoistApiKey}
            onChange={e => {
              handleSettingChange('todoistApiKey', e);
              setApiKeyMissing(false);
            }}
            error={apiKeyMissing}
            helperText={
              <React.Fragment>
                {apiKeyMissing ? 'An API token is required. ' : ''}
                Find yours in Todoist under <Link href='https://app.todoist.com/app/settings/integrations/developer' target='_blank' rel='noreferrer'>Settings → Integrations → Developer</Link>
              </React.Fragment>
            }
            slotProps={{input: {endAdornment: (
              <InputAdornment position='end'>
                <IconButton edge='end' size='small' onClick={() => setShowApiKey(!showApiKey)} aria-label={showApiKey ? 'Hide API token' : 'Show API token'}>
                  <i className={`bi bi-${showApiKey ? 'eye-slash' : 'eye'}`}/>
                </IconButton>
              </InputAdornment>
            )}}}/>
        </SettingsSection>

        <SettingsSection title='Tasks to plan' icon='funnel'>
          <TextField label='Task filter' size='small' fullWidth value={modifiedSettings.taskFilter} onChange={e => handleSettingChange('taskFilter', e)}
            helperText='Any Todoist filter query, e.g. "today | overdue"'/>
        </SettingsSection>

        <SettingsSection title='Labels to apply' icon='tags' optional>
          <Typography variant='body2' color='text.secondary'>
            Add a label to tasks based on when you schedule them
          </Typography>
          <LabelSettingField label='Today' color='#2e7d32' value={modifiedSettings.todayLabel} onChange={e => handleSettingChange('todayLabel', e)}/>
          <LabelSettingField label='Tomorrow' color='#edca02' value={modifiedSettings.tomorrowLabel} onChange={e => handleSettingChange('tomorrowLabel', e)}/>
          <LabelSettingField label='Later' color='#ed6c02' value={modifiedSettings.otherLabel} onChange={e => handleSettingChange('otherLabel', e)}/>
        </SettingsSection>

        <Button type='submit' variant='contained' size='large' sx={{marginTop: 'auto !important', borderRadius: 3}}>
          Save & start planning
        </Button>
      </Stack>
    </form>
  );
}

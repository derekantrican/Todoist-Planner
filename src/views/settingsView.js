import React, { useState } from 'react';
import { readSettings, saveSettings } from '../helpers/settings';

function SettingsSection(props) {
  return (
    <section className='settingsSection'>
      <div className='settingsSectionTitle'>
        {props.icon ? <i style={{fontSize: 18, opacity: 0.8}} className={`bi bi-${props.icon}`}/> : null}
        <span style={{fontWeight: 600}}>{props.title}</span>
        {props.optional ? <span className='secondary'>(optional)</span> : null}
      </div>
      {props.children}
    </section>
  );
}

function TextField(props) {
  return (
    <div className={`textField${props.error ? ' error' : ''}`}>
      <label className='textFieldBox'>
        {props.startAdornment}
        <input type={props.type ?? 'text'} value={props.value} onChange={props.onChange} placeholder={props.placeholder}
          autoComplete={props.autoComplete}/>
        {props.endAdornment}
        <span className='textFieldLabel'>{props.label}</span>
      </label>
      {props.helperText ? <p className='textFieldHelper'>{props.helperText}</p> : null}
    </div>
  );
}

function LabelSettingField(props) {
  return (
    <TextField label={props.label} placeholder='No label' value={props.value} onChange={props.onChange}
      startAdornment={<i style={{color: props.color}} className='bi bi-tag-fill'/>}/>
  );
}

export function SettingsView(props) {
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
    <form onSubmit={saveChanges} style={{height: '100%', overflowY: 'auto', position: 'relative'}}>
      {props.onCancel ?
        <button type='button' className='iconButton' aria-label='Close settings' onClick={props.onCancel} style={{position: 'absolute', top: -8, right: 0 /*A negative right would overflow the scrollable form and add a horizontal scrollbar*/}}>
          <i className='bi bi-x-lg'/>
        </button>
      : null}
      <div style={{display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480, minHeight: '100%', margin: '0 auto', boxSizing: 'border-box' /*No padding: the app's screen margin already pads this view*/}}>
        <div style={{textAlign: 'center', paddingTop: 16, paddingBottom: 8}}>
          <i style={{fontSize: 48, color: 'var(--todoist-red)'}} className='bi bi-calendar2-check'/>
          <h1 style={{fontSize: 34, fontWeight: 600, lineHeight: 1.235}}>Todoist Planner</h1>
          <p className='secondary' style={{margin: '0 40px'}}>Quickly triage your tasks so you know what to focus on</p>
        </div>

        <SettingsSection title='Connect to Todoist'>
          {/*Todo: this should be an "auth todoist" button that follows the auth flow: https://developer.todoist.com/guides/#authorization*/}
          <TextField label='API token' autoComplete='off'
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
                Find yours in Todoist under <a href='https://app.todoist.com/app/settings/integrations/developer' target='_blank' rel='noreferrer'>Settings → Integrations → Developer</a>
              </React.Fragment>
            }
            endAdornment={
              <button type='button' className='iconButton' style={{width: 32, height: 32, fontSize: 18}}
                onClick={() => setShowApiKey(!showApiKey)} aria-label={showApiKey ? 'Hide API token' : 'Show API token'}>
                <i className={`bi bi-${showApiKey ? 'eye-slash' : 'eye'}`}/>
              </button>
            }/>
        </SettingsSection>

        <SettingsSection title='Tasks to plan' icon='funnel'>
          <TextField label='Task filter' value={modifiedSettings.taskFilter} onChange={e => handleSettingChange('taskFilter', e)}
            helperText='Any Todoist filter query, e.g. "today | overdue"'/>
        </SettingsSection>

        <SettingsSection title='Labels to apply' icon='tags' optional>
          <p className='secondary small'>
            Add a label to tasks based on when you schedule them
          </p>
          <LabelSettingField label='Today' color='#2e7d32' value={modifiedSettings.todayLabel} onChange={e => handleSettingChange('todayLabel', e)}/>
          <LabelSettingField label='Tomorrow' color='#edca02' value={modifiedSettings.tomorrowLabel} onChange={e => handleSettingChange('tomorrowLabel', e)}/>
          <LabelSettingField label='Later' color='#ed6c02' value={modifiedSettings.otherLabel} onChange={e => handleSettingChange('otherLabel', e)}/>
        </SettingsSection>

        <button type='submit' className='primaryButton' style={{marginTop: 'auto'}}>
          Save & start planning
        </button>
      </div>
    </form>
  );
}

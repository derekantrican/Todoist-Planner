import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Typography,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import './App.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import { todoistCompleteTask, todoistGetLabels, todoistGetTasks, todoistUpdateSettingsFromTodoist, todoistUpdateTask } from './helpers/todoistApi';
import { convertMarkdown, nextWeek, toFloatingDateTime, todayPlusDays, todayWithHour } from './helpers/utils';
import { readSettings, settings } from './helpers/settings';
import { SettingsView } from './views/settingsView';
import { FinalMessage } from './views/finalMessageView';
import { PickerDialog } from './views/pickerDialog';
import { LoadingView } from './views/loadingView';
import { ActionButton, TextActionButton } from './views/actionButton';
import { NoTasksView } from './views/noTasks';

const screenMargin = 16;

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const Label = (props) => {
  //Shared labels aren't returned by /labels (only personal ones are) so they won't have color data - show them with the default color
  var matchingLabelData = props.todoistLabels.find(label => label.name === props.name);

  return (
    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
      <i style={{margin: 5, color: matchingLabelData?.color}} className='bi bi-tag-fill'/>
      <Typography>{props.name}</Typography>
    </div>
  );
}

function App() {
  const [visibleItemsDoneAnimating, setVisibleItemsDoneAnimating] = useState(false);
  const [currentPrimaryItemAnimation, setCurrentPrimaryItemAnimation] = useState(null);
  const [actionPanelType, setActionPanelType] = useState('primary');

  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [noTasks, setNoTasks] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [todoistLabels, setTodoistLabels] = useState([]);

  const [pickerDialogOpen, setPickerDialogOpen] = useState(false);
  const [pickerDialogType, setPickerDialogType] = useState(null);
  const [pickerDialogResultHandler, setPickerDialogResponseHandler] = useState(() => {});

  useEffect(() => {
    async function populateTodoistItems() {
      const data = await todoistGetTasks();

      //Replace markdown links like '[some link](www.google.com)' to 'some link' for easier reading
      //(I could also let these go through showdown.js and be rendered, but I don't know if I want to
      //encourage clicking off the app during planning as it would have to start over)
      const markdownLinkRegex = /\[(.*)\]\(.*\)/;
      data.forEach(t => t.content = markdownLinkRegex.test(t.content) ? t.content.replace(markdownLinkRegex, "$1") : t.content);

      if (data.length === 0) {
        setNoTasks(true); //If we get 0 tasks back from this filter, we should let the user know
      }

      setTasks(data);
      setLoading(false);
    };

    async function populateTodoistLabels() {
      const data = await todoistGetLabels();
      setTodoistLabels(data);
    }

    const settings = readSettings();
    const settingsRequested = /\/settings\/?$/.test(window.location.pathname); //Todo: replace with an in-app settings button

    if (settings.todoistApiKey && !settingsRequested) {
      Promise.all([
        populateTodoistItems(),
        populateTodoistLabels(),
  
        todoistUpdateSettingsFromTodoist(),
      ]).catch(e => {
        console.log(e);
        alert('Problem getting data from todoist - please check your API token');
        setShowSettings(true);
        setLoading(false);
      });
    }
    else {
      setShowSettings(true);
      setLoading(false);
    }
  }, []);

  const checkForVisibleItemsAnimationFinished = (e) => {
    var animatedElement = e.target;

    if (!visibleItemsDoneAnimating) {
      if (animatedElement.getBoundingClientRect().left > window.innerWidth || animatedElement.id === tasks[tasks.length - 1].id) {
        setVisibleItemsDoneAnimating(true);
      }
    }
  };

  const animationEnd = (e) => {
    var animatedElement = e.target;

    checkForVisibleItemsAnimationFinished(e);

    if (currentPrimaryItemAnimation === 'collapse') {
      animatedElement.classList.add("slideInOthers");
      setCurrentPrimaryItemAnimation('slideInOthers');
    }
    else if (currentPrimaryItemAnimation === 'slideInOthers') {
      setTasks(tasks.slice(1));
      setCurrentPrimaryItemAnimation(null);
    }
  }

  const removeFirstUiItem = () => {
    setCurrentPrimaryItemAnimation('collapse'); //Todo: need different animations for different types of "remove item" (today/later/done/delete all need separate animations)
    document.querySelectorAll("#taskContainer *")[0].firstChild.classList.add("collapse");
  };

  const openPickerDialog = (type, callback) => {
    setPickerDialogType(type);
    setPickerDialogResponseHandler(() => res => callback(res));
    setPickerDialogOpen(true);
  };

  const reportUpdateError = (e) => {
    console.log(e);
    alert('Problem updating a task in todoist - the change may not have been saved');
  };

  const rescheduleCurrentTask = (rescheduleTo, label) => {
    var currentTask = tasks[0];

    if (rescheduleTo === 'other') {
      openPickerDialog('time', res => {
        rescheduleCurrentTask(res, label);
      });
    }
    else if (rescheduleTo === 'someday') {
      openPickerDialog('date', res => {
        rescheduleCurrentTask(res, label);
      });
    }
    else {
      var payload = {due:{}};

      if (currentTask.due?.is_recurring) { //Preserve the existing recurrence (re-sending just the due string would advance overdue tasks an extra day)
        payload.due.string = currentTask.due.string;
        payload.due.is_recurring = true;
      }

      //In API v1 any time is part of due.date: "2026-10-22" (all day), "2026-10-22T13:00:00" (floating) or "2026-10-22T13:00:00Z" (fixed timezone, in UTC)
      var currentDueDate = currentTask.due?.date;
      var currentHasTime = currentDueDate?.includes('T') ?? false;
      var currentIsFloating = currentHasTime && !currentDueDate.endsWith('Z');

      if (rescheduleTo instanceof Date) {
        var rescheduleHasTime = rescheduleTo.getHours() !== 0;
        if (!rescheduleHasTime && currentHasTime) {
          //If rescheduleTo does not have a time component & the current due date does, then use the time from the latter in rescheduleTo
          var taskDueDateTime = new Date(currentDueDate); //Floating times are parsed as local, 'Z' times are converted to local
          rescheduleTo = new Date(rescheduleTo.getFullYear(), rescheduleTo.getMonth(), rescheduleTo.getDate(),
                                  taskDueDateTime.getHours(), taskDueDateTime.getMinutes());
          rescheduleHasTime = true;
        }

        if (!rescheduleHasTime) {
          payload.due.date = rescheduleTo.yyyyMMdd();
        }
        else if (currentIsFloating) {
          payload.due.date = toFloatingDateTime(rescheduleTo); //Keep floating times floating (local time, no 'Z')
        }
        else {
          payload.due.date = rescheduleTo.toISOString(); //Send fixed times as UTC with 'Z' (a time without 'Z' is not interpreted as local)
        }
      }

      if (label) {
        //Get the new list of labels (pass through a Set to only get unique)
        payload.labels = [...new Set((currentTask.labels ?? []).concat([label]))];
      }

      todoistUpdateTask(currentTask.id, payload).catch(reportUpdateError);

      removeFirstUiItem();
      setActionPanelType('primary');
    }
  };

  const completeCurrentTask = () => {
    var currentTask = tasks[0];
    todoistCompleteTask(currentTask.id).catch(reportUpdateError);
    removeFirstUiItem();
  };

  const deleteCurrentTask = () => {
    var currentTask = tasks[0];
    todoistCompleteTask(currentTask.id).catch(reportUpdateError);
    removeFirstUiItem();
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'end', height: '100%', overflow: 'hidden', padding: screenMargin, boxSizing: 'border-box'}}>
        {loading ? <LoadingView/> : 
          showSettings ? <SettingsView/> : // Todo: this should instead be a modal dialog or something so a user can change the settings later
          noTasks ? <NoTasksView/> :
          tasks.length === 0 ? <FinalMessage/> :
          <React.Fragment>
            <div style={{top: screenMargin, left: screenMargin, right: screenMargin, position: 'absolute'}}>
              {visibleItemsDoneAnimating && tasks.length > 0 ?
                <Typography variant="h3" sx={{margin: '5px'}}
                  dangerouslySetInnerHTML={{__html:  convertMarkdown(tasks[0].content)}} />
              : null}
              {/*Todo: maybe show the current scheduling data for a task. Like "Today at 3:30pm" or "Every Monday at 5pm"*/}
              {visibleItemsDoneAnimating && tasks.length > 0 ? tasks[0].labels.map(l => 
                <Label key={l} todoistLabels={todoistLabels} name={l}/>
              ) : null}
            </div>
            {/*Negative right margin so the dots still slide in from the edge of the screen rather than from inside the screen margin*/}
            <div id="taskContainer" style={{display: 'flex', flexDirection: 'row', alignItems: 'end', marginLeft: '50%', marginRight: -screenMargin, height: 40}}>
              {tasks.map(t =>
                <div key={t.id} id ={t.id} className={!visibleItemsDoneAnimating ? "slideInAnimation" : ""} onAnimationEnd={animationEnd}>
                  <div className='todoistTaskItem' style={{marginBottom: visibleItemsDoneAnimating && t === tasks[0] ? 20 : 5}}/>
                </div>
              )}
            </div>
            <div style={{visibility: !visibleItemsDoneAnimating ? 'hidden' : '', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: 110}}>
              <div style={{display: actionPanelType === 'primary' ? 'flex' : 'none' /*Todo: need transition/animation for panel collapse*/, flexDirection: 'row', justifyContent: 'space-between'}}>
                <ActionButton text='Today' color='success' icon='arrow-down-circle'
                  onClick={() => setActionPanelType('today')} enabled={!currentPrimaryItemAnimation}/>
                <ActionButton text='Later' color='warning' icon='arrow-right-circle'
                  onClick={() => setActionPanelType('later')} enabled={!currentPrimaryItemAnimation}/>
                <ActionButton text='Done' color='info' icon='check-circle'
                  onClick={() => completeCurrentTask()} enabled={!currentPrimaryItemAnimation}/>
                <ActionButton text='Delete' color='error' icon='x-circle'
                  onClick={() => deleteCurrentTask()} enabled={!currentPrimaryItemAnimation}/>
              </div>
              <div style={{display: actionPanelType === 'today' ? 'flex' : 'none', flexDirection: 'row', justifyContent: 'space-between', overflowX: 'auto'}}>
                <ActionButton text="Don't&nbsp;Set Time" color='success' icon='bell-slash' size='30'
                  onClick={() => rescheduleCurrentTask(todayPlusDays(0), settings.todayLabel)} enabled={!currentPrimaryItemAnimation}/>
                <TextActionButton text='Morning' innerText='10' size='40' color='success'
                  onClick={() => rescheduleCurrentTask(todayWithHour(10), settings.todayLabel)} enabled={!currentPrimaryItemAnimation}/>
                <TextActionButton text='Noon' innerText='12' size='40' color='success'
                  onClick={() => rescheduleCurrentTask(todayWithHour(12), settings.todayLabel)} enabled={!currentPrimaryItemAnimation}/>
                <TextActionButton text='Afternoon' innerText='15' size='40' color='success'
                  onClick={() => rescheduleCurrentTask(todayWithHour(15), settings.todayLabel)} enabled={!currentPrimaryItemAnimation}/>
                <TextActionButton text='Evening' innerText='19' size='40' color='success'
                  onClick={() => rescheduleCurrentTask(todayWithHour(19), settings.todayLabel)} enabled={!currentPrimaryItemAnimation}/>
                <TextActionButton text='Other' innerText='?' color='success' icon='question' size='40'
                  onClick={() => rescheduleCurrentTask('other', settings.todayLabel)} enabled={!currentPrimaryItemAnimation}/>
              </div>
              <div style={{display: actionPanelType === 'later' ? 'flex' : 'none', flexDirection: 'row', justifyContent: 'space-between'}}>
                <ActionButton text='Tomorrow' color='warning' icon='chevron-right' size='50'
                  onClick={() => rescheduleCurrentTask(todayPlusDays(1), settings.tomorrowLabel)} enabled={!currentPrimaryItemAnimation}/>
                <ActionButton text='In 2 days' color='warning' icon='chevron-double-right' size='50'
                  onClick={() => rescheduleCurrentTask(todayPlusDays(2), settings.otherLabel)} enabled={!currentPrimaryItemAnimation}/>
                <ActionButton text='Next week' color='warning' icon='chevron-bar-right' size='50'
                  onClick={() => rescheduleCurrentTask(nextWeek(settings.next_week), settings.otherLabel)} enabled={!currentPrimaryItemAnimation}/>
                <ActionButton text='Someday' color='warning' icon='question' size='50'
                  onClick={() => rescheduleCurrentTask('someday', settings.otherLabel)} enabled={!currentPrimaryItemAnimation}/>
              </div>
            </div>
          </React.Fragment>
        }
      </div>
      <PickerDialog open={pickerDialogOpen} type={pickerDialogType} onClose={() => setPickerDialogOpen(false)} resultHandler={pickerDialogResultHandler}/>
    </ThemeProvider>
  );
}

export default App;

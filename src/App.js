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
import { convertMarkdown, nextWeek, todayPlusDays, todayWithHour } from './helpers/utils';
import { readSettings, settings } from './helpers/settings';
import { SettingsView } from './views/settingsView';
import { FinalMessage } from './views/finalMessageView';
import { PickerDialog } from './views/pickerDialog';
import { LoadingView } from './views/loadingView';
import { ActionButton, TextActionButton } from './views/actionButton';
import { NoTasksView } from './views/noTasks';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const Label = (props) => {
  var matchingLabelData = props.todoistLabels.find(label => label.name === props.name);
  if (!matchingLabelData) {
    return null;
  }

  return (
    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
      <i style={{margin: 5, color: matchingLabelData.color}} className='bi bi-tag-fill'/>
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
      const data = (await todoistGetTasks()).results;

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
      const data = (await todoistGetLabels()).results;
      setTodoistLabels(data);
    }

    const settings = readSettings();

    if (settings.todoistApiKey) {
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

      if (currentTask.due.is_recurring) { //Preserve the existing due string
        payload.due.string = currentTask.due.string;
      }
      
      if (rescheduleTo instanceof Date) {
        if (rescheduleTo.getHours() === 0) {
          //If rescheduleTo does not have a time component & currentTask.due.datetime does, then use the time from the latter in rescheduleTo
          var taskDueDateTime = new Date(currentTask.due.datetime);
          if (currentTask.due.datetime && taskDueDateTime.getHours() !== 0) {
            rescheduleTo = new Date(rescheduleTo.getFullYear(), rescheduleTo.getMonth(), rescheduleTo.getDate(),
                                    taskDueDateTime.getHours(), taskDueDateTime.getMinutes());

            payload.due.date = rescheduleTo.toISOString();
          }
          else {
            payload.due.date = rescheduleTo.yyyyMMdd();
          }
        }
        else {
          payload.due.date = rescheduleTo.toISOString();
        }
      }

      if (label) {
        //Get the new list of labels (pass through a Set to only get unique)
        payload.labels = [...new Set((currentTask.labels ?? []).concat([label]))];
      }

      todoistUpdateTask(currentTask.id, payload);

      removeFirstUiItem();
      setActionPanelType('primary');
    }
  };

  const completeCurrentTask = () => {
    var currentTask = tasks[0];
    todoistCompleteTask(currentTask.id);
    removeFirstUiItem();
  };

  const deleteCurrentTask = () => {
    var currentTask = tasks[0];
    todoistCompleteTask(currentTask.id);
    removeFirstUiItem();
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'end', height: '100%', overflow: 'hidden'}}>
        {loading ? <LoadingView/> : 
          showSettings ? <SettingsView/> : // Todo: this should instead be a modal dialog or something so a user can change the settings later
          noTasks ? <NoTasksView/> :
          tasks.length === 0 ? <FinalMessage/> :
          <React.Fragment>
            <div style={{top: 0, position: 'absolute'}}>
              {visibleItemsDoneAnimating && tasks.length > 0 ?
                <Typography variant="h3" sx={{margin: '5px', width: 'calc(100% - 16px - 10px)' /*16 is body margin, 10 is this margin*/}}
                  dangerouslySetInnerHTML={{__html:  convertMarkdown(tasks[0].content)}} />
              : null}
              {/*Todo: maybe show the current scheduling data for a task. Like "Today at 3:30pm" or "Every Monday at 5pm"*/}
              {visibleItemsDoneAnimating && tasks.length > 0 ? tasks[0].labels.map(l => 
                <Label key={l} todoistLabels={todoistLabels} name={l}/>
              ) : null}
            </div>
            <div id="taskContainer" style={{display: 'flex', flexDirection: 'row', alignItems: 'end', marginLeft: '50%', height: 40}}>
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

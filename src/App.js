import * as React from 'react';
import { useEffect, useState } from 'react';
import showdown from 'showdown';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogActions,
  Input,
  IconButton,
  Typography,
  ThemeProvider,
  createTheme,
} from '@mui/material'; //Todo: we're probably not really utililizing much of MUI - maybe we can get rid of it
import './App.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import { todoistCompleteTask, todoistGetLabels, todoistGetTasks, todoistUpdateTask } from './helpers/todoistApi';
import { nextWeek, todayPlusDays, todayWithHour, todayWithTime } from './helpers/utils';
import { readSettings } from './helpers/settings';
import { SettingsView } from './views/settingsView';
import { FinalMessage } from './views/finalMessageView';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const convertMarkdown = (text) => {
  if (text) {
    return new showdown.Converter().makeHtml(text);
  }

  return null;
}

function LoadingView() {
  return (
    <div style={{margin: 'auto'}}>
      <CircularProgress size="10rem" sx={{}}/>
      <Typography sx={{marginTop: 10}}>Getting your tasks...</Typography>
    </div>
  );
}

function PickerDialog(props) {
  const [result, setResult] = useState(null);

  const onSubmit = () => {
      props.resultHandler(result);
      props.onClose();
  };

  const setTimeResult = e => {
    const valParts = e.target.value.split(':');
    setResult(todayWithTime(valParts[0], valParts[1]));
  };

  const setDateResult = e => {
    const dateParts = e.target.value.split('-');
    setResult(new Date(dateParts[0], dateParts[1] - 1, dateParts[2]));
  };

  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="xl">
      <DialogContent>
        <div style={{display: 'flex', justifyContent: 'center'}}>
          {props.type === 'time' ?
            <Input style={{fontSize: '2rem'}} type="time" defaultValue="12:00" //Using noon as a default
              onChange={e => setTimeResult(e)}/> :
            <Input style={{fontSize: '2rem'}} type="date" defaultValue={new Date().yyyyMMdd()} //Using today as a default
              onChange={e => setDateResult(e)}/>
          }
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onSubmit}>OK</Button>
      </DialogActions>
    </Dialog>
  );
};

function ActionButton(props) {
  return (
    <div style={{margin: props.margin ?? '5px', display: 'flex', flexDirection: 'column'}}>
      <IconButton color={props.color} onClick={props.onClick} disabled={!props.enabled}>
        <i style={{fontSize: props.size ?? 60}} className={`bi bi-${props.icon}`}/>
      </IconButton>
      <Typography sx={{textAlign: 'center'}}>{props.text}</Typography>
    </div>
  );
}

function TextActionButton(props) {
  return (
    <div style={{margin: props.margin ?? '5px 10px', display: 'flex', flexDirection: 'column'}}>
      <Button sx={{fontSize: props.size ?? 60, padding: 0, lineHeight: 1.4, minWidth: 0}} color={props.color} onClick={props.onClick} disabled={!props.enabled}>
        {props.innerText}
      </Button>
      <Typography sx={{textAlign: 'center'}}>{props.text}</Typography>
    </div>
  );
}

function App() {
  //TODO BEFORE PUBLIC:
  // - In the future, it'd be great if this was published publicly (maybe hosted on GitHub pages).
  //   If so, then we would need to remove some hardcoded values and make some of the following changes
  //   (with the following being stored in the browser's localstorage):
  //     - Use MUI DatePicker & TimePicker (for picker dialog). In this version, we can't use them because they're
  //         in another package that can't be included via CDN. So we're using HTML input elements instead
  //     - Auth flow with Todoist: https://developer.todoist.com/guides/#authorization
  //     - Settings view:
  //       - Ability to change the filter query (default: 'today | overdue') for what tasks to use in this app
  //       - Default day of the week for "next week" reschedules
  //       - (maybe) Whether the "Today" times should be 24 hr or 12 hr time
  //       - (maybe) ability to customize the time options for "today" reschedules
  //       - (optional) default labels to apply for "today" tasks and "other" (not today) tasks

  const [visibleItemsDoneAnimating, setVisibleItemsDoneAnimating] = useState(false);
  const [currentPrimaryItemAnimation, setCurrentPrimaryItemAnimation] = useState(null);
  const [actionPanelType, setActionPanelType] = useState('primary');

  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [todoistLabels, setTodoistLabels] = useState([]);

  const [pickerDialogOpen, setPickerDialogOpen] = useState(false);
  const [pickerDialogType, setPickerDialogType] = useState(null);
  const [pickerDialogResultHandler, setPickerDialogResponseHandler] = useState(() => {});

  useEffect(() => {
    async function populateTodoistItems() {
      const data = await todoistGetTasks(); //Todo: in the public version, we'll need to catch auth errors and show an auth prompt instead

      //Replace markdown links like '[some link](www.google.com)' to 'some link' for easier reading
      //(I could also let these go through showdown.js and be rendered, but I don't know if I want to
      //encourage clicking off the app during planning as it would have to start over)
      const markdownLinkRegex = /\[(.*)\]\(.*\)/;
      data.forEach(t => t.content = markdownLinkRegex.test(t.content) ? t.content.replace(markdownLinkRegex, "$1") : t.content);

      setTasks(data);
      setLoading(false);
    };

    async function populateTodoistLabels() {
      const data = await todoistGetLabels();
      setTodoistLabels(data);
    }

    const settings = readSettings();

    if (settings.todoistApiKey) {
      populateTodoistItems();
      populateTodoistLabels();
    }
    else {
      setShowSettings(true);
      setLoading(false);
    }
  }, []);

  const itemStyle = {
    borderRadius: '50%',
    backgroundColor: 'red',
    height: 15,
    width: 15,
    margin: 5,
  };

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
          tasks.length === 0 ? <FinalMessage/> : //Todo: show a "no tasks for today" message instead of the FinalMessage if there were initially no tasks
          <React.Fragment>
            <div style={{top: 0, position: 'absolute'}}>
              {visibleItemsDoneAnimating && tasks.length > 0 ?
                <Typography variant="h3" sx={{margin: '5px', width: 'calc(100% - 16px - 10px)' /*16 is body margin, 10 is this margin*/}}
                  dangerouslySetInnerHTML={{__html:  convertMarkdown(tasks[0].content)}} />
                : null
              }
              {/*Todo: maybe show the current scheduling data for a task. Like "Today at 3:30pm" or "Every Monday at 5pm"*/}
              {visibleItemsDoneAnimating && tasks.length > 0 ? tasks[0].labels.map(l => {
                var matchingLabelData = todoistLabels.find(label => label.name === l);
                if (!matchingLabelData) {
                  return null;
                }

                return (<div key={l} style={{display: 'flex', flexDirection: 'row'}}>
                  <i style={{margin: 5, color: matchingLabelData.color}} className='bi bi-tag-fill'/>
                  <Typography>{l}</Typography>
                </div>);
              })
              : null}
            </div>
            <div id="taskContainer" style={{display: 'flex', flexDirection: 'row', alignItems: 'end', marginLeft: '50%', height: 40}}>
              {tasks.map(t =>
                <div key={t.id} id ={t.id} className={!visibleItemsDoneAnimating ? "slideInAnimation" : ""} onAnimationEnd={animationEnd}>
                  <div style={{...itemStyle, marginBottom: visibleItemsDoneAnimating && t === tasks[0] ? 20 : 5}}/>
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
                <ActionButton text="Don't&nbsp;Set Time" color='success' icon='bell-slash' size='40'
                  onClick={() => rescheduleCurrentTask(todayPlusDays(0), 'SELECTED_TODAY' /*Todo: get 'today label' from settings*/)} enabled={!currentPrimaryItemAnimation}/>
                <TextActionButton text='Morning' innerText='10' size='40' color='success'
                  onClick={() => rescheduleCurrentTask(todayWithHour(10), 'SELECTED_TODAY' /*Todo: get 'today label' from settings*/)} enabled={!currentPrimaryItemAnimation}/>
                <TextActionButton text='Noon' innerText='12' size='40' color='success'
                  onClick={() => rescheduleCurrentTask(todayWithHour(12), 'SELECTED_TODAY' /*Todo: get 'today label' from settings*/)} enabled={!currentPrimaryItemAnimation}/>
                <TextActionButton text='Afternoon' innerText='15' size='40' color='success'
                  onClick={() => rescheduleCurrentTask(todayWithHour(15), 'SELECTED_TODAY' /*Todo: get 'today label' from settings*/)} enabled={!currentPrimaryItemAnimation}/>
                <TextActionButton text='Evening' innerText='19' size='40' color='success'
                  onClick={() => rescheduleCurrentTask(todayWithHour(19), 'SELECTED_TODAY' /*Todo: get 'today label' from settings*/)} enabled={!currentPrimaryItemAnimation}/>
                <TextActionButton text='Other' innerText='?' color='success' icon='question' size='40'
                  onClick={() => rescheduleCurrentTask('other', 'SELECTED_TODAY' /*Todo: get 'today label' from settings*/)} enabled={!currentPrimaryItemAnimation}/>
              </div>
              <div style={{display: actionPanelType === 'later' ? 'flex' : 'none', flexDirection: 'row', justifyContent: 'space-between'}}>
                <ActionButton text='Tomorrow' color='warning' icon='chevron-right' size='50'
                  onClick={() => rescheduleCurrentTask(todayPlusDays(1) /*Todo: get 'tomorrow label' from settings*/)} enabled={!currentPrimaryItemAnimation}/>
                <ActionButton text='In 2 days' color='warning' icon='chevron-double-right' size='50'
                  onClick={() => rescheduleCurrentTask(todayPlusDays(2) /*Todo: get 'other label' from settings*/)} enabled={!currentPrimaryItemAnimation}/>
                <ActionButton text='Next week' color='warning' icon='chevron-bar-right' size='50'
                  onClick={() => rescheduleCurrentTask(nextWeek() /*Todo: get 'other label' from settings*/)} enabled={!currentPrimaryItemAnimation}/>
                <ActionButton text='Someday' color='warning' icon='question' size='50'
                  onClick={() => rescheduleCurrentTask('someday' /*Todo: get 'other label' from settings*/)} enabled={!currentPrimaryItemAnimation}/>
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

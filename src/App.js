import * as React from 'react';
import { useEffect, useState } from 'react';
import './App.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import { todoistCompleteTask, todoistGetLabels, todoistGetTasks, todoistUpdateSettingsFromTodoist, todoistUpdateTask } from './helpers/todoistApi';
import { convertMarkdown, describeDue, greeting, isOverdue, nextWeek, toFloatingDateTime, todayPlusDays, todayWithHour, todoistColor } from './helpers/utils';
import { readSettings, settings } from './helpers/settings';
import { SettingsView } from './views/settingsView';
import { FinalMessage } from './views/finalMessageView';
import { PickerDialog } from './views/pickerDialog';
import { LoadingView } from './views/loadingView';
import { ActionButton } from './views/actionButton';
import { NoTasksView } from './views/noTasks';

const screenMargin = 16;
const todoistRed = 'var(--todoist-red)';

const isSettingsPath = () => /\/settings\/?$/.test(window.location.pathname);

//Wide screens get the desktop layout (task cards on the right), everything else gets the mobile layout (dot train)
const desktopQuery = '(min-width: 1100px)';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(desktopQuery).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(desktopQuery);
    const onChange = e => setIsDesktop(e.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  return isDesktop;
}

const Label = (props) => {
  //Shared labels aren't returned by /labels (only personal ones are) so they won't have color data - show them with the default color
  var matchingLabelData = props.todoistLabels.find(label => label.name === props.name);

  return (
    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4}}>
      <i style={{fontSize: 12, color: todoistColor(matchingLabelData?.color)}} className='bi bi-tag-fill'/>
      <span className='secondary small'>{props.name}</span>
    </div>
  );
}

function App() {
  const isDesktop = useIsDesktop();
  const [visibleItemsDoneAnimating, setVisibleItemsDoneAnimating] = useState(false);
  const [currentPrimaryItemAnimation, setCurrentPrimaryItemAnimation] = useState(null);
  const [actionPanelType, setActionPanelType] = useState('primary');

  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsCancelable, setSettingsCancelable] = useState(false);
  const [userFirstName, setUserFirstName] = useState(null);
  const [noTasks, setNoTasks] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [activeTaskId, setActiveTaskId] = useState(null); //null means the first task (desktop lets the user pick a different one)
  const currentTask = tasks.find(t => t.id === activeTaskId) ?? tasks[0];
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
    if (settings.todoistApiKey && !isSettingsPath()) {
      Promise.all([
        populateTodoistItems(),
        populateTodoistLabels(),

        todoistUpdateSettingsFromTodoist().then(user => setUserFirstName(user.full_name?.split(' ')[0])),
      ]).catch(e => {
        console.log(e);
        alert('Problem getting data from todoist - please check your API token');
        setShowSettings(true);
        setLoading(false);
      });
    }
    else {
      setSettingsCancelable(!!settings.todoistApiKey); //Visiting /settings with a saved token can go back to the planner
      setShowSettings(true);
      setLoading(false);
    }
  }, []);

  const openSettings = () => {
    setSettingsCancelable(true);
    setShowSettings(true);
  };

  const closeSettings = () => {
    if (isSettingsPath()) {
      window.location.href = window.location.pathname.replace(/\/settings\/?$/, '/'); //Tasks were never loaded, so load the planner
    }
    else {
      setShowSettings(false);
    }
  };

  const checkForVisibleItemsAnimationFinished = (e) => {
    var animatedElement = e.target;

    if (!visibleItemsDoneAnimating) {
      //Done once an item lands off screen (dots off the right on mobile, cards off the bottom on desktop) or the last item lands
      var rect = animatedElement.getBoundingClientRect();
      if (rect.left > window.innerWidth || rect.top > window.innerHeight || animatedElement.id === tasks[tasks.length - 1].id) {
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
      //Remove the handled task and go back to the top of the list (even if the user had picked a task further down)
      setTasks(tasks.filter(t => t !== currentTask));
      setActiveTaskId(null);
      setCurrentPrimaryItemAnimation(null);
    }
  }

  const removeCurrentUiItem = () => {
    setCurrentPrimaryItemAnimation('collapse'); //Todo: need different animations for different types of "remove item" (today/later/done/delete all need separate animations)
    document.getElementById(currentTask.id).firstChild.classList.add("collapse");
  };

  const selectTask = (task) => {
    if (!visibleItemsDoneAnimating || currentPrimaryItemAnimation) {
      return; //Don't switch while things are still moving
    }

    setActiveTaskId(task.id);
    setActionPanelType('primary');
  };

  //Keep the active card in view on desktop (e.g. when the next task becomes active further down the list)
  useEffect(() => {
    if (isDesktop && currentTask && visibleItemsDoneAnimating) {
      document.getElementById(currentTask.id)?.scrollIntoView({block: 'nearest', behavior: 'smooth'});
    }
  }, [isDesktop, currentTask, visibleItemsDoneAnimating]);

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

      removeCurrentUiItem();
      setActionPanelType('primary');
    }
  };

  const completeCurrentTask = () => {
    todoistCompleteTask(currentTask.id).catch(reportUpdateError);
    removeCurrentUiItem();
  };

  const deleteCurrentTask = () => {
    todoistCompleteTask(currentTask.id).catch(reportUpdateError);
    removeCurrentUiItem();
  };

  const actionsEnabled = !currentPrimaryItemAnimation;

  //The Today/Later/Done/Delete buttons (and the Today & Later sub-panels) - shared by the mobile & desktop layouts
  const actionPanels = (
    <React.Fragment>
      <div style={{display: actionPanelType === 'primary' ? 'flex' : 'none' /*Todo: need transition/animation for panel collapse*/, flexDirection: 'row', justifyContent: 'space-around'}}>
        <ActionButton text='Today' color='success' icon='arrow-down'
          onClick={() => setActionPanelType('today')} enabled={actionsEnabled}/>
        <ActionButton text='Later' color='warning' icon='arrow-right'
          onClick={() => setActionPanelType('later')} enabled={actionsEnabled}/>
        <ActionButton text='Done' color='info' icon='check-lg'
          onClick={() => completeCurrentTask()} enabled={actionsEnabled}/>
        <ActionButton text='Delete' color='error' icon='x-lg'
          onClick={() => deleteCurrentTask()} enabled={actionsEnabled}/>
      </div>
      <div style={{display: actionPanelType === 'today' ? 'flex' : 'none', flexDirection: 'row', justifyContent: 'space-around'}}>
        <ActionButton small text='No time' color='success' icon='bell-slash'
          onClick={() => rescheduleCurrentTask(todayPlusDays(0), settings.todayLabel)} enabled={actionsEnabled}/>
        <ActionButton small text='Morning' innerText='10' color='success'
          onClick={() => rescheduleCurrentTask(todayWithHour(10), settings.todayLabel)} enabled={actionsEnabled}/>
        <ActionButton small text='Noon' innerText='12' color='success'
          onClick={() => rescheduleCurrentTask(todayWithHour(12), settings.todayLabel)} enabled={actionsEnabled}/>
        <ActionButton small text='Afternoon' innerText='15' color='success'
          onClick={() => rescheduleCurrentTask(todayWithHour(15), settings.todayLabel)} enabled={actionsEnabled}/>
        <ActionButton small text='Evening' innerText='19' color='success'
          onClick={() => rescheduleCurrentTask(todayWithHour(19), settings.todayLabel)} enabled={actionsEnabled}/>
        <ActionButton small text='Other' color='success' icon='question-lg'
          onClick={() => rescheduleCurrentTask('other', settings.todayLabel)} enabled={actionsEnabled}/>
      </div>
      <div style={{display: actionPanelType === 'later' ? 'flex' : 'none', flexDirection: 'row', justifyContent: 'space-around'}}>
        <ActionButton text='Tomorrow' color='warning' icon='chevron-right'
          onClick={() => rescheduleCurrentTask(todayPlusDays(1), settings.tomorrowLabel)} enabled={actionsEnabled}/>
        <ActionButton text='In 2 days' color='warning' icon='chevron-double-right'
          onClick={() => rescheduleCurrentTask(todayPlusDays(2), settings.otherLabel)} enabled={actionsEnabled}/>
        <ActionButton text='Next week' color='warning' icon='chevron-bar-right'
          onClick={() => rescheduleCurrentTask(nextWeek(settings.next_week), settings.otherLabel)} enabled={actionsEnabled}/>
        <ActionButton text='Someday' color='warning' icon='question-lg'
          onClick={() => rescheduleCurrentTask('someday', settings.otherLabel)} enabled={actionsEnabled}/>
      </div>
    </React.Fragment>
  );

  const taskLabels = (task) => (
    <div style={{display: 'flex', flexWrap: 'wrap', columnGap: 12, marginTop: 4}}>
      {task.labels.map(l => <Label key={l} todoistLabels={todoistLabels} name={l}/>)}
    </div>
  );

  const tasksLeft = `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'} left`;

  const showingDesktopPlanner = isDesktop && !loading && !showSettings && !noTasks && tasks.length > 0;

  const settingsButton = (
    <button type='button' className='iconButton' aria-label='Settings' onClick={openSettings}>
      <i className='bi bi-gear'/>
    </button>
  );

  const mobilePlanner = () => (
    <React.Fragment>
      <div style={{marginBottom: 'auto', paddingTop: 48}}>
        <h1 style={{fontSize: 34, fontWeight: 700, lineHeight: 1.15}}>
          {greeting()}{userFirstName ? <React.Fragment><br/>{userFirstName},</React.Fragment> : ','}
        </h1>
        <p className='secondary' style={{marginTop: 12}}>
          Take a moment to plan your day · {tasksLeft}
        </p>
      </div>
      {/*Negative right margin so the dots still slide in from the edge of the screen rather than from inside the screen margin*/}
      <div id="taskContainer" style={{display: 'flex', flexDirection: 'row', alignItems: 'end', marginLeft: '50%', marginRight: -screenMargin, height: 40}}>
        {tasks.map(t =>
          <div key={t.id} id ={t.id} className={!visibleItemsDoneAnimating ? "slideInAnimation" : ""} onAnimationEnd={animationEnd}>
            <div className='todoistTaskItem' style={visibleItemsDoneAnimating && t === currentTask ? {marginBottom: 14, backgroundColor: todoistRed} : null}/>
          </div>
        )}
      </div>
      <div style={{visibility: !visibleItemsDoneAnimating ? 'hidden' : '', display: 'flex', gap: 14, alignItems: 'flex-start', minHeight: 96, marginTop: 12}}>
        <div style={{width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 3, backgroundColor: todoistRed}}/>
        <div style={{minWidth: 0}}>
          <h2 className='taskTitle' style={{fontSize: 20, fontWeight: 700, lineHeight: 1.3}}
            dangerouslySetInnerHTML={{__html: convertMarkdown(currentTask.content)}}/>
          <p className='secondary small' style={{marginTop: 4}}>{describeDue(currentTask.due, settings.time_format)}</p>
          {taskLabels(currentTask)}
        </div>
      </div>
      <div style={{visibility: !visibleItemsDoneAnimating ? 'hidden' : '', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: 120,
        margin: `8px ${-screenMargin}px ${-screenMargin}px`, padding: '8px 8px 16px', backgroundColor: 'var(--surface)', borderRadius: '24px 24px 0 0'}}>
        {actionPanels}
      </div>
    </React.Fragment>
  );

  //Desktop: the current task & actions on the left, with the queue of tasks as cards flowing up on the right
  const desktopPlanner = () => (
    <div className='desktopPlanner'>
      <div className='desktopMain'>
        <div>
          <h1 style={{fontSize: 44, fontWeight: 700, lineHeight: 1.15}}>
            {greeting()}{userFirstName ? `, ${userFirstName}` : ''}<span style={{color: todoistRed}}>.</span>
          </h1>
          <p className='secondary' style={{fontSize: 24, fontWeight: 600, opacity: 0.6}}>Take a moment to plan your day</p>
        </div>
        <div style={{visibility: !visibleItemsDoneAnimating ? 'hidden' : '', margin: 'auto 0', maxWidth: 640}}>
          <p className='secondary small' style={{fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase'}}>Now planning · {tasksLeft}</p>
          <h2 className='taskTitle' style={{fontSize: 36, fontWeight: 700, lineHeight: 1.2, marginTop: 8}}
            dangerouslySetInnerHTML={{__html: convertMarkdown(currentTask.content)}}/>
          <p className='secondary' style={{marginTop: 8}}>{describeDue(currentTask.due, settings.time_format)}</p>
          {taskLabels(currentTask)}
        </div>
        <div className='desktopActions' style={{visibility: !visibleItemsDoneAnimating ? 'hidden' : ''}}>
          {actionPanels}
        </div>
      </div>
      <div className='desktopQueue'>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12}}>
          <p className='secondary small' style={{fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase'}}>Up next</p>
          <div style={{marginRight: -10 /*Line the gear icon (not its round hit area) up with the cards' right edge*/}}>{settingsButton}</div>
        </div>
        {/*Only scrollable once the cards have flowed in (so the flow-up animation doesn't flash a scrollbar)*/}
        <div id="taskContainer" className='taskQueue' style={{overflowY: visibleItemsDoneAnimating ? 'auto' : 'hidden'}}>
          {tasks.map((t, i) =>
            <div key={t.id} id={t.id} className={!visibleItemsDoneAnimating ? 'flowUpAnimation' : ''}
              style={{animationDelay: `${Math.min(i, 10) * 80}ms`}} onAnimationEnd={animationEnd}>
              <div className={`taskCard${visibleItemsDoneAnimating && t === currentTask ? ' current' : ''}`}
                role='button' tabIndex={0} aria-pressed={t === currentTask} onClick={() => selectTask(t)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectTask(t); } }}>
                <div className='taskTitle' style={{fontWeight: 600, lineHeight: 1.35}} dangerouslySetInnerHTML={{__html: convertMarkdown(t.content)}}/>
                <p className='small' style={{marginTop: 4, fontWeight: 600, color: isOverdue(t.due) ? todoistRed : 'var(--primary)'}}>
                  {describeDue(t.due, settings.time_format)}
                </p>
                {taskLabels(t)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <React.Fragment>
      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'end', height: '100%', overflow: 'hidden', padding: screenMargin, boxSizing: 'border-box'}}>
        {!loading && !showSettings && !showingDesktopPlanner ? //The desktop planner shows the gear in its "Up next" header instead
          <div style={{position: 'absolute', top: screenMargin / 2, right: screenMargin / 2, zIndex: 1}}>{settingsButton}</div>
        : null}
        {loading ? <LoadingView/> :
          showSettings ? <SettingsView onCancel={settingsCancelable ? closeSettings : null}/> :
          noTasks ? <NoTasksView/> :
          tasks.length === 0 ? <FinalMessage/> :
          isDesktop ? desktopPlanner() : mobilePlanner()
        }
      </div>
      <PickerDialog open={pickerDialogOpen} type={pickerDialogType} onClose={() => setPickerDialogOpen(false)} resultHandler={pickerDialogResultHandler}/>
    </React.Fragment>
  );
}

export default App;

const Machine = require('xstate').Machine;

const vaccineMachine = Machine({
    id: 'vaccine',
    initial: 'welcome',
    context: {
      retries: 0
    },
    states: {
      welcome: {
        on: {
          PRESS_ONE: 'voicemail',
          PRESS_TWO: 'numberInput',
          PRESS_THREE: 'welcome',
        },
        // actions: ['welcome'],
      },
      numberInput: {
        on: {
          PRESS_POUND: 'numberInputConfirm',
        }
      },
      numberInputConfirm: {
        on: {
          PRESS_ONE: 'voicemail',
          PRESS_TWO: 'numberInput',
          PRESS_THREE: 'numberInputConfirm',
        }
      },
      voicemail: {
        on: {
          PRESS_POUND: 'hangup',
        }
      },
      hangup: {
        type: 'final',
      }
    }
  }, {
    actions: {
      welcome: (context, event) => {
        // context.res.write('<Say>Hello</Say>');
        // context.res.send();
        console.log('Welcome to Vaccination Helpline. Please enter your phone number at the beep');
      }
    }
  });

const existingSessions = {};

const getStateForSession = (sid) => {
  return existingSessions[sid] || vaccineMachine.initialState;
}

const saveStateForSession = (sid, newState) => {
  existingSessions[sid] = newState;
}

module.exports = {
  vaccineMachine,
  getStateForSession,
  saveStateForSession,
}

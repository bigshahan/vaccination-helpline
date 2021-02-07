const { Machine, assign } = require('xstate');

const vaccineMachine = Machine({
    id: 'vaccine',
    initial: 'welcome',
    context: {
      phone: null,
    },
    states: {
      welcome: {
        on: {
          PRESS_ONE: 'voicemail',
          PRESS_TWO: 'numberInput',
          PRESS_THREE: 'welcome',
        },
      },
      numberInput: {
        on: {
          PRESS_POUND: {
            target: 'numberInputConfirm',
            actions: assign({
              phone: (context, event) => event.Digits
            }),
          }
        }
      },
      numberInputConfirm: {
        on: {
          PRESS_ONE: 'voicemail',
          PRESS_TWO: 'numberInput',
          PRESS_THREE: 'numberInputConfirm',
        },
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
  });

const existingSessions = {};

const getStateForSession = (sid) => {
  return existingSessions[sid] || vaccineMachine.initialState;
}

const saveStateForSession = (sid, newState) => {
  existingSessions[sid] = newState;
}

const deleteStateForSession = (sid) => {
  delete existingSessions[sid];
}

module.exports = {
  vaccineMachine,
  getStateForSession,
  saveStateForSession,
  deleteStateForSession,
}

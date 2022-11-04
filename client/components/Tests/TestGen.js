import React, { useRef, useEffect, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { StateField, StateEffect } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { EditorView, keymap } from '@codemirror/view';
import { Decoration } from '@codemirror/view';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import readOnlyRangesExtension from 'codemirror-readonly-ranges';
import axios from 'axios';
import { autocompletion } from '@codemirror/autocomplete';
import { connect } from 'react-redux';
const { v4: uuidv4 } = require('uuid');
import Modal from 'react-modal';
import {
  CloseIcon,
  InstructionsIcon,
  PromptIcon,
  CodeEditorIcon,
  ConsoleIcon,
} from '../SVG_Icons';

const turnOffCtrlS = () => {
  document.addEventListener('keydown', (e) => {
    const pressedS = e.key === 's';
    const pressedCtrl = navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey;

    if (pressedS && pressedCtrl) {
      e.preventDefault();
    }
  });
};

let baseTheme = EditorView.theme({
  '.cm-content *': {
    color: 'white',
  },
});

const dynamicReadOnlyRanges = (ranges) => {
  return (editor) => {
    const theRanges = ranges.map((range) => {
      return {
        from: editor.doc.line(range.from).from,
        to: editor.doc.line(range.to).to,
      };
    });

    return theRanges;
  };
};

export const Editor = (props) => {
  const editor = useRef();
  const editor2 = useRef();
  const [code, setCode] = useState('');
  const [code2, setCode2] = useState('');
  const [id, setId] = useState(uuidv4());
  const [passedTest, setPassedTest] = useState('false');
  const [response, setResponse] = useState('See your results here!');
  const { currentPrompt } = props;

  const templateTest = currentPrompt.templateTest;
  const narrative = currentPrompt.narrative;
  const jsCode = currentPrompt.jsCode;
  const readOnlyRangesProp = currentPrompt.readOnlyRanges;
  const strikeMarkRanges = currentPrompt.strikeMarkRanges;
  const orderNum = currentPrompt.orderNum;

  const completions = [
    { label: 'toBe', type: 'keyword' },
    { label: 'expect', type: 'keyword' },
    { label: 'test', type: 'keyWord' },
    { label: 'describe', type: 'keyword' },
    { label: 'toEqual', type: 'keyWord' },
    { label: 'not', type: 'keyWord' },
  ];

  function myCompletions(context) {
    let before = context.matchBefore(/\w+/);
    if (!context.explicit && !before) return null;
    return {
      from: before ? before.from : context.pos,
      options: completions,
      validFor: /^\w*$/,
    };
  }

  // Instructions editor

  const onUpdate2 = EditorView.updateListener.of((v) => {
    setCode2(v.state.doc.toString());
  });

  const getReadOnlyRanges2 = (editor2) => {
    return [
      {
        from: undefined,
        to: editor2.doc.line(0).to,
      },
      {
        from: editor2.doc.line(1).from,
        to: editor2.doc.line(100).to,
      },
      {
        from: editor2.doc.line(editor2.doc.lines).from,
        to: undefined,
      },
    ];
  };

  useEffect(() => {
    turnOffCtrlS();

    const state = EditorState.create({
      doc: narrative || code2,
      extensions: [
        basicSetup,
        oneDark,
        baseTheme,
        onUpdate2,
        javascript(),
        EditorView.lineWrapping,
        readOnlyRangesExtension(getReadOnlyRanges2),
      ],
    });

    const view2 = new EditorView({
      state,
      parent: editor2.current,
      lineWrapping: true,
    });

    return () => {
      view2.destroy();
    };
  }, [narrative]);

  // Template Test editor

  const onUpdate = EditorView.updateListener.of((v) => {
    setCode(v.state.doc.toString());
  });

  useEffect(() => {
    const addMarks = StateEffect.define();
    const filterMarks = StateEffect.define();

    const markField = StateField.define({
      create() {
        return Decoration.none;
      },
      update(value, tr) {
        value = value.map(tr.changes);
        for (let effect of tr.effects) {
          if (effect.is(addMarks))
            value = value.update({ add: effect.value, sort: true });
          else if (effect.is(filterMarks))
            value = value.update({ filter: effect.value });
        }
        return value;
      },
      provide: (f) => EditorView.decorations.from(f),
    });

    const state = EditorState.create({
      // TODOLATER: change this to templateTest
      doc: currentPrompt.solution,

      extensions: [
        basicSetup,
        EditorState.tabSize.of(16),
        keymap.of([defaultKeymap, indentWithTab]),
        oneDark,
        markField,
        javascript(),
        onUpdate,
        EditorView.lineWrapping,
        readOnlyRangesExtension(dynamicReadOnlyRanges(readOnlyRangesProp)),
        autocompletion({ override: [myCompletions] }),
      ],
    });

    const view = new EditorView({ state, parent: editor.current });
    const strikeMark = Decoration.mark({
      attributes: { style: 'background: #3730a3' },
    });

    const strikeMarkArray = strikeMarkRanges?.map((range) => {
      return strikeMark.range(range.start, range.end);
    });
    view.dispatch({
      effects: addMarks.of(strikeMarkArray),
    });

    return () => {
      view.destroy();
    };
  }, [templateTest]);

  const fetchData = () => {
    axios
      .post('/api/evaluateTest', {
        code,
        orderNum,
      })
      .then((res) => {
        setResponse(res.data);
        if (
          res.data.includes('That looks right! Go ahead and submit your test!')
        ) {
          setPassedTest('true');
        }
      });
  };

  const onSubmit = () => {
    fetchData();
  };

  const runTest = () => {
    if (passedTest === 'true') {
      setId(uuidv4());
      axios
        .post('/api/submitTest', {
          code,
          id,
          passedTest,
          jsCode,
        })
        .then((res) => {
          setPassedTest('false');
          setResponse(res.data);
        });
    } else {
      setResponse('Get the test to pass before you submit!');
    }
  };

  const [modalIsOpen, setIsOpen] = React.useState(false);
  const [jsModalIsOpen, jsIsOpen] = React.useState(false);

  function openSolutionModal() {
    setIsOpen(true);
  }

  function openJSCodeModal() {
    jsIsOpen(true);
  }

  function afterOpenModal() {
    // references are now sync'd and can be accessed.
    // subtitle.style.color = '#f00';
  }

  function closeModal() {
    setIsOpen(false);
    jsIsOpen(false);
  }

  Modal.setAppElement('#app');

  return (
    <div className='flex h-[93vh] max-h-[93vh] w-full grow flex-col overflow-hidden bg-slate-900'>
      <Modal
        isOpen={modalIsOpen}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        style={{
          overlay: {
            backgroundColor: 'rgba(255,255,255,0.1',
            backdropFilter: 'blur(8px)',
          },
        }}
        contentLabel='Example Modal'
        className='mx-auto mt-[96px] flex max-w-[60vw] flex-col overflow-hidden rounded-xl bg-slate-900 text-white shadow-xl'>
        <div>
          <div className='flex justify-between border-b border-slate-700 px-8 py-5'>
            <h2 className='text-2xl'>Solution Code</h2>
            <CloseIcon onClick={closeModal} />
          </div>
          <div className='min-h-[300px] bg-[#090e1a] p-8 font-mono text-slate-200'>
            {currentPrompt.solution}
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={jsModalIsOpen}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        style={{
          overlay: {
            backgroundColor: 'rgba(255,255,255,0.1',
            backdropFilter: 'blur(8px)',
          },
        }}
        contentLabel='Example Modal'
        className='mx-auto mt-[96px] flex max-w-[60vw] flex-col overflow-hidden rounded-xl bg-slate-900 text-white shadow-xl'>
        <div>
          <div className='flex justify-between border-b border-slate-700 px-8 py-5'>
            <h2 className='text-2xl'>
              JavaScript Code Your Unit Test Will Run Against
            </h2>
            <CloseIcon onClick={closeModal} />
          </div>
          <div className='min-h-[300px] bg-[#090e1a] p-8 font-mono text-slate-200'>
            {jsCode}
          </div>
        </div>
      </Modal>
      <div className='flex h-3/4 w-full'>
        <div
          id='left-column'
          className='flex w-1/2 flex-col overflow-hidden border-r border-slate-700'>
          <div className='flex gap-3 border-b border-slate-700 px-8 pt-4 pb-3 text-slate-400'>
            <InstructionsIcon />
            Instructions
          </div>
          <div
            id='instructions-editor'
            className='scrollbar overflow-y-auto bg-[#090e1a]'
            style={{ height: '100%' }}
            ref={editor2}></div>
        </div>

        <div id='right-column' className='relative flex h-full w-1/2 flex-col'>
          <div
            id='prompt-container'
            className='flex max-h-[40%] min-h-[30%] shrink-0 flex-col overflow-hidden'>
            <div className='flex gap-3 border-b border-slate-700 bg-slate-900 px-6 pt-4 pb-3 text-slate-400'>
              <PromptIcon />
              Prompt
            </div>
            <div
              id='prompt'
              className='scrollbar grow overflow-y-auto bg-slate-900 px-8 py-4 text-lg text-slate-200'>
              <div className='max-w-[800px] leading-7'>
                {currentPrompt.prompt}
              </div>
            </div>
          </div>
          <div
            id='your-code-container'
            className='flex grow flex-col overflow-hidden'>
            <div className='flex gap-3 border-y border-slate-700 bg-slate-900 py-3 px-6 text-slate-400'>
              <CodeEditorIcon />
              Your Test
            </div>

            <div
              id='your-editor'
              className='scrollbar h-full grow overflow-y-auto overflow-x-hidden bg-[#090e1a]'
              ref={editor}></div>
          </div>
          <div
            id='button-container'
            className='flex gap-6 border-t border-slate-700 py-4 px-6'>
            <button
              className='self-center rounded-lg border border-lime-400 px-4 py-2 text-sm text-lime-400 transition-all hover:bg-lime-400/10 2xl:text-base'
              onClick={onSubmit}>
              Evaluate Test
            </button>
            <button
              className='filled-button self-center rounded-lg bg-lime-400 px-4 py-2  text-sm text-slate-900 transition-shadow 2xl:text-base'
              onClick={runTest}>
              Submit Test
            </button>
            <button
              className='self-center rounded-lg border border-lime-400 px-4 py-2 text-sm text-lime-400 transition-all hover:bg-lime-400/10 2xl:text-base'
              onClick={openSolutionModal}>
              Show Solution
            </button>
            <button
              className='filled-button self-center rounded-lg bg-lime-400 px-4 py-2  text-sm text-slate-900 transition-shadow 2xl:text-base'
              onClick={openJSCodeModal}>
              Show JavaScript Code
            </button>
          </div>
        </div>
      </div>
      <div
        className='flex grow flex-col overflow-hidden border-b border-slate-700'
        style={{}}>
        <div className='flex items-center border-y border-slate-700 px-8 py-3 text-slate-400'>
          <div className='flex items-center gap-3'>
            <ConsoleIcon />
            Results
          </div>
        </div>

        <div className='scrollbar grow overflow-y-auto bg-[#090e1a] px-8 py-4 font-mono text-slate-200'>
          {response}
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (props) => {
  return props;
};

export default connect(mapStateToProps)(Editor);

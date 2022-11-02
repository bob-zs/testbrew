import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { NextArrowIcon, PreviousArrowIcon } from '../SVG_Icons';
import { Link } from 'react-router-dom';

const PaginatedTests = ({ children: TestingChildComponent, prompts }) => {
  const [currentTestIx, setCurrentTestIx] = useState(
    window.localStorage.index * 1 || 0,
  );
  const onNext = () => {
    setCurrentTestIx((ix) => ix + 1);
  };
  const onPrevious = () => {
    setCurrentTestIx((ix) => ix - 1);
  };

  // console.log(CurrentTest);

  const styleOnCurrent = (ix) =>
    ix === currentTestIx && 'bg-lime-400 text-slate-900 pointer-events-none';

  useEffect(() => {
    window.localStorage.setItem('index', currentTestIx);
    // console.log(currentTestIx, window.localStorage.index * 1);
  }, [currentTestIx]);

  return (
    <div className='top-0 mt-[-74px] flex h-screen max-h-screen flex-col justify-between overflow-hidden pt-[70px]'>
      {/* Overlay blocking access on screens smaller than 768px */}
      <div className='absolute top-0 z-10 flex h-full w-full items-center justify-center bg-slate-900 md:hidden'>
        Please use a desktop browser to continue learning
      </div>
      {/* End of overlay */}
      {TestingChildComponent}
      <div
        className='flex max-h-[7vh] items-center justify-center gap-4 p-8'
        style={{}}>
        <button
          onClick={onPrevious}
          disabled={currentTestIx === 0}
          className='group mr-4 flex items-center gap-3 text-lime-400 hover:text-lime-600  disabled:text-slate-700'>
          <PreviousArrowIcon />
          Previous
        </button>
        {prompts.map((_test, ix) => {
          return (
            <span
              key={ix}
              className={`${styleOnCurrent(
                ix,
              )}  flex h-8 w-8 cursor-pointer items-center justify-center self-center rounded-lg transition-all hover:bg-slate-600`}>
              <Link to={`/dynamic/${ix + 1}`}>{`  ${ix + 1}  `}</Link>
            </span>
          );
        })}
        <button
          onClick={onNext}
          disabled={currentTestIx === prompts.length - 1}
          className='group ml-4 flex items-center gap-3 text-lg text-lime-400 transition-all hover:text-lime-600  disabled:text-slate-700'>
          Next
          <NextArrowIcon />
        </button>
      </div>
    </div>
  );
};

// Get number of prompts from local storage

// export default PaginatedTests;
const mapStateToProps = (state) => {
  return {
    prompts: state.prompts,
  };
};

export default connect(mapStateToProps)(PaginatedTests);

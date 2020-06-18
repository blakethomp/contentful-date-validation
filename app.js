import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { render } from 'react-dom';
import { init, locations } from 'contentful-ui-extensions-sdk';
import { DateEditor } from '@contentful/field-editor-date';
import ValidationMessage from '@contentful/forma-36-react-components/dist/components/ValidationMessage';

import '@contentful/field-editor-date/styles/styles.css';
import '@contentful/forma-36-react-components/dist/styles.css';
import './css/global.css';

init(sdk => {
  if (!sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    render(<ValidatedDateField sdk={sdk} />, document.getElementById('root'));
    sdk.window.startAutoResizer();
  } else {
    sdk.app.setReady();
  }
});

function ValidatedDateField ({ sdk }) {
  const parameters = {
    instance: {
      format: 'dateonly',
      ampm: '12'
    }
  };
  const endDateField = sdk.field;
  const startDateField = sdk.entry.fields['dateStarted'];
  const validationPropsField = sdk.entry.fields['validation_props'];
  const [isValid, setValidState] = useState(checkValid(startDateField.getValue(), endDateField.getValue()));
  const endFieldLabel = sdk.contentType.fields.find(element => element.id === endDateField.id).name;
  const startFieldLabel = sdk.contentType.fields.find(element => element.id === startDateField.id).name;

  useEffect(() => {
    endDateField.setInvalid(!isValid);
  });

  useEffect(() => {
    const inputs = document.querySelectorAll('input');

    if (inputs.length > 0) {
      inputs.forEach(input => {
        input.addEventListener('focus', () => {
          sdk.window.stopAutoResizer();
          sdk.window.updateHeight(document.scrollingElement.scrollHeight + 2);
        });

        input.addEventListener('focusout', () => {
          sdk.window.startAutoResizer();
        });
      })
    }
  }, [sdk.window]);

  const setValidCallback = useCallback(async valid => {
    const validationProps = validationPropsField.getValue() || {};
    if (valid !== validationProps[endDateField.id]) {
      validationProps[endDateField.id] = valid;
      await validationPropsField.setValue(validationProps);
    }
    setValidState(valid);
  }, [endDateField, validationPropsField]);

  useEffect(() => {
    const endDateFieldChanged = endDateField.onValueChanged(value => {
      const startDateValue = startDateField.getValue();
      setValidCallback(checkValid(startDateValue, value));
    });

    const startDateChanged = startDateField.onValueChanged(value => {
      const endDateValue = endDateField.getValue();
      setValidCallback(checkValid(value, endDateValue));
    });

    return () => {
      endDateFieldChanged();
      startDateChanged();
    }
  }, [startDateField, endDateField, setValidCallback]);

  return (
    <>
      <DateEditor
        isInitiallyDisabled={true}
        field={sdk.field}
        parameters={parameters}
      />
      {!isValid &&
        <ValidationMessage>{endFieldLabel} cannot be before {startFieldLabel}.</ValidationMessage>
      }
    </>
  )
}

function checkValid(startDateValue, endDateValue) {
  if (startDateValue && endDateValue) {
    const startDate = new Date(startDateValue);
    const endDate = new Date(endDateValue);
    if (startDate > endDate) {
      return false;
    }
  }
  return true;
}

ValidatedDateField.propTypes = {
  sdk: PropTypes.object
};

import React, { createContext, useContext, useRef } from 'react';
import { Form, Grid, FormItemProps } from 'antd-mobile';
import { useStore } from 'zustand';
import classnames from 'classnames';

import { _get } from '../../utils';
import { ConfigContext } from '../../models/context';
import { getWidgetName } from '../../models/mapping';
import getRuleList from '../../models/validates';
import FieldWrapper from './field';
import { 
  getParamValue, 
  getFieldProps,
  getPath,
  getLabel,
  getExtraView,
} from './module';

const UpperContext: any = createContext(() => {});
const valuePropNameMap = {
  checkbox: 'checked',
  switch: 'checked'
};

export default (props: any) => {
  const { store, schema, path, children, dependValues, rootPath, renderCore } = props;

  if (schema?.hidden) {
    return null;
  }

  const fieldRef: any = useRef();
  const formCtx: any = useStore(store, (state: any) => state.context);
  const upperCtx: any = useContext(UpperContext);
  const configCtx = useContext(ConfigContext);
  const { form, widgets, methods, globalProps } = configCtx;

  const { hidden, properties, dependencies, inlineMode: _inlineMode, remove, removeText, visible = true, ...otherSchema } = schema;

  let widgetName = getWidgetName(schema);
  // Component not found
  if (!widgetName) {
    const ErrorSchema = widgets['errorSchemaWidget'];
    return <ErrorSchema schema={schema} />;
  }
  
  const getValueFromKey = getParamValue(formCtx, upperCtx, schema);
  let Widget = widgets[widgetName] || widgets['Html'];

  const fieldProps = getFieldProps(widgetName, schema, {
    widgets,
    methods,
    form,
    dependValues,
    globalProps,
    path: getPath(path),
    rootPath
  });

  // if (schema.type === 'void') {
  //   return ( 
  //     <Col span={24}>
  //       <Widget {...fieldProps } />
  //     </Col>
  //   );
  // }

  const displayType = getValueFromKey('displayType');
  const labelWidth = getValueFromKey('labelWidth');

  if (widgetName === 'Collapse') {
    return <Widget {...fieldProps} renderCore={renderCore} />
  }

  // Render Container Components
  if (children) {
    fieldProps.children = (
      <Grid columns={1}>
        {children}
      </Grid>
    );
    
    return (
      <UpperContext.Provider
        value={{
          column: schema.column,
          labelCol: schema.labelCol,
          fieldCol: schema.fieldCol,
          displayType: schema.displayType,
          labelWidth: schema.labelWidth,
          noStyle: schema.noStyle,
          exist: true,
        }}
      >
        <Widget 
          labelWidth={labelWidth} 
          displayType={schema.displayType} 
          {...fieldProps} 
          {...otherSchema} 
        />
      </UpperContext.Provider>
    );
  }

  // Render field components
  let label = getLabel(schema, displayType, widgets);
  let noStyle = getValueFromKey('noStyle');

  const extra = getExtraView('extra', schema, widgets);
  const help = getExtraView('help', schema, widgets);
  const ruleList = getRuleList(schema, form, methods);
  const readOnly = getValueFromKey('readOnly');
  const valuePropName = schema.valuePropName || valuePropNameMap[widgetName] || undefined;

  if (readOnly) {
    fieldProps.readOnly = readOnly;
  }

  if (!fieldProps.fieldRef) {
    fieldProps.fieldRef = fieldRef;
  }

  if (!label) {
    noStyle = true;
  }

  if (readOnly) {
    Widget = widgets[schema.readOnlyWidget] || widgets['ReadOnlyText'];
  }

  const defaultValue = schema.default ?? schema.defaultValue;

  const itemProps: FormItemProps = {
    label,
    valuePropName,
    hidden,
    extra,
    help,
    noStyle,
    dependencies,
    name:path,
    initialValue: defaultValue,
    rules: readOnly ? [] : ruleList,
    className:classnames('fr-field', {'fr-field-visibility': !visible}),
  }

  if (fieldRef?.current?.open) {
    itemProps.onClick = () => {
      fieldRef.current.open();
    }
  }

  return (
    <Grid.Item>
      <Form.Item {...itemProps}>
        <FieldWrapper
          Field={Widget}
          fieldProps={fieldProps}
          defaultValue={defaultValue}
        />
      </Form.Item>
    </Grid.Item>
  );
}

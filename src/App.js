import React, { Component } from 'react';
import { Dropdown } from 'semantic-ui-react';
import { Header, Icon } from 'semantic-ui-react'
import { Container } from 'semantic-ui-react'
import { Divider, Form, Label, Segment } from 'semantic-ui-react'
import { Button } from 'semantic-ui-react'
import ReactSimpleRange from 'react-simple-range';
import autoBind from 'react-autobind';
import polyval from 'compute-polynomial';

import './App.css';
import 'semantic-ui-css/semantic.css';

import carData from '../fit/result/cars.json';

export const range = (x0, x1, n) => {
  var data = new Array(n);
  const step = (x1 - x0) / (n - 1);
  var i;
  for (i = 0; i < n; i++) {
    data[i] = x0 + step * i;
  }
  return data;
};

class AppHeader extends Component {
  render() {
    return (
      <div>
        <Header as='h2' icon textAlign='center'>
          <Icon name='battery full' size="huge" />
          <Header.Content>
            {this.props.title}
          </Header.Content>
        </Header>
      </div>
    );
  }
}


class CarSelector extends Component {
  render() {
    return (
      <Dropdown
        placeholder="Select car"
        fluid
        selection
        defaultValue={this.props.defaultValue}
        options={this.props.options}
        onChange={(event, obj) => {
          this.props.onChange(obj.value);
        }}
      />
    );
  }
}

class Range {
  render() {
    return (
      null
    );
  }
}

class App extends Component {

  constructor(props) {
    super(props);
    autoBind(this);
    this.defaultState = {
      carId: 0,
      socStart: 10,
      socEnd: 80,
      chargeTime: 0,
    }

    this.state = Object.assign({}, this.defaultState);
    this.carOptions = carData.map((item) => {
      const text = item.maker + " " + item.model + " (" + item.battTotal + " kWh)"
      const value = item.id;
      return { text, value };
    });
  }

  componentWillMount() {
    this.updateStatistics();
  }

  handleCarChange(carId) {
    this.setState({ carId });
    this.updateStatistics();
  }

  handleSOCChange(type, value) {
    const newValue = parseFloat(value);
    var state = {};
    if (type === 'socStart') {
      state.socStart = newValue;
      if (newValue > this.state.socEnd) {
        state.socEnd = newValue
      }
    } else if (type === 'socEnd') {
      state.socEnd = newValue;
      if (newValue < this.state.socStart) {
        state.socStart = newValue;
      }
    }

    this.setState(state);
    this.updateStatistics();
  }

  handleSOCReset() {
    this.setState({
      socStart: this.defaultState.socStart,
      socEnd: this.defaultState.socEnd,
    });
    this.updateStatistics();
  }

  updateStatistics() {
    const car = carData[this.state.carId];
    const e1 = car.battUsable * this.state.socStart / 100;
    const e2 = car.battUsable * this.state.socEnd / 100;
    const t1 = polyval(car.f, e1);
    const t2 = polyval(car.f, e2);
    console.log(e1 + " " + e2 + " " + t1 + " " + t2);
    const chargeTime = t2 - t1;
    this.setState({ chargeTime });
  }

  secondsToTime(secs) {
    secs = Math.round(secs);
    var hours = Math.floor(secs / (60 * 60));

    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);

    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);

    var obj = {
        "h": hours,
        "m": minutes,
        "s": seconds
    };
    return obj;
  }

  formatChargeTime(secs) {
    secs = Math.ceil(secs / 60) * 60;
    const t = this.secondsToTime(secs);
    var str = t.m + " m";
    if ((secs / 3600) > 1) {
      str = t.h + " h " + str;
    }
    return str;
  }

  computeChargingCost(secs, pricePerHour) {
    const pricePerSeconds = pricePerHour / 3600;
    return (secs * pricePerSeconds);
  }

  render() {
    const rangeOptions = {
      step: 1, 
      min: 0,
      max: 98,
    };
    const car = carData[this.state.carId];
    const energy = car.battUsable * (this.state.socEnd - this.state.socStart) / 100;
    const cost = this.computeChargingCost(this.state.chargeTime, 10);
    const costPerUnit = cost / energy;
    return (
      <Container text>
        <AppHeader title={"DCFC Time Calculator"} />
        <CarSelector
          options={this.carOptions}
          defaultValue={this.state.carId}
          onChange={(value) => {
            this.handleCarChange(value);
          }}/>
        <Divider />
        <label>Battery at start: {this.state.socStart} %</label>
        <ReactSimpleRange
          {...rangeOptions}
          defaultValue={this.state.socStart}
          onChange={(event) => {this.handleSOCChange("socStart", event.value)}}
        />
        <label>Battery at end: {this.state.socEnd} %</label>
        <ReactSimpleRange
          {...rangeOptions}
          defaultValue={this.state.socEnd}
          onChange={(event) => {this.handleSOCChange("socEnd", event.value)}}
        />
        <Button content='Reset' onClick={(event) => {this.handleSOCReset()}}/>
        <h1>{this.formatChargeTime(this.state.chargeTime)}</h1>
        <h1>{Math.max(0, energy).toFixed(1)} kWh</h1>
        <h1>{Math.max(0, cost).toFixed(2)} $</h1>
        <h1>{Math.max(0, costPerUnit).toFixed(2)} $/kWh</h1>
        <h1>{1e3}</h1>
      </Container>
    );
  }
}

export default App;

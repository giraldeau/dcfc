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

const secondsToTime = (secs) => {
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

const formatChargeTime = (secs) => {
  //secs = Math.ceil(secs / 60) * 60;
  const t = secondsToTime(secs);
  var str = "";
  if ((secs / 3600) < 1) {
    var str = t.s + " s";
  }
  if ((secs / 60) > 1) {
    str = t.m + " m " + str;
  }
  if ((secs / 3600) > 1) {
    str = t.h + " h " + str;
  }
  return str;
}

class StatisticTable extends Component {
  render() {
    var costPerKm = 0;
    if (this.props.range > 0) {
      costPerKm = this.props.cost / this.props.range;
    }

    return (
      <table className="ui very basic collapsing celled table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Time</td>
            <td>{formatChargeTime(this.props.time)}</td>
          </tr>
          <tr>
            <td>Added range</td>
            <td>{Math.max(0, this.props.range).toFixed(0)} km</td>
          </tr>
          <tr>
            <td>Energy</td>
            <td>{Math.max(0, this.props.kwh).toFixed(1)} kWh</td>
          </tr>
          <tr>
            <td>Cost</td>
            <td>{Math.max(0, this.props.cost).toFixed(2)} $</td>
          </tr>
          <tr>
            <td>Cost per km</td>
            <td>{Math.max(0, costPerKm).toFixed(4)} $</td>
          </tr>
        </tbody>
      </table>
    );
  }
}

StatisticTable.propTypes = {
  kwh: React.PropTypes.number,
  time: React.PropTypes.number,
  cost: React.PropTypes.number,
  range: React.PropTypes.number,
};

StatisticTable.defaultProps = {
  kwh: 0,
  time: 0,
  cost: 0,
  range: 0,
};

class App extends Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.defaultState = {
      carId: 0,
      socStart: 10,
      socEnd: 80,
      efficiency: carData[0].efficiency,
    }

    this.state = Object.assign({}, this.defaultState);
    this.carOptions = carData.map((item) => {
      const text = item.maker + " " + item.model + " (" + item.battTotal + " kWh)"
      const value = item.id;
      return { text, value };
    });
  }

  handleCarChange(carId) {
    const car = carData[carId];
    this.setState({ carId, efficiency: car.efficiency });
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
  }

  handleReset() {
    const car = carData[this.state.carId];
    this.setState({
      socStart: this.defaultState.socStart,
      socEnd: this.defaultState.socEnd,
      efficiency: car.efficiency,
    });
  }

  handleEfficiencyChange(efficiency) {
    this.setState({ efficiency });
  }

  computeChargingTime(car, socStart, socEnd) {
    const e1 = car.battUsable * socStart / 100;
    const e2 = car.battUsable * socEnd / 100;
    const t1 = polyval(car.polyfit, e1);
    const t2 = polyval(car.polyfit, e2);
    return (t2 - t1);
  }

  computeChargingCost(secs, pricePerHour) {
    const pricePerSeconds = pricePerHour / 3600;
    return (secs * pricePerSeconds);
  }

  render() {
    const socOptions = {
      step: 1,
      min: 0,
      max: 98,
      thumbSize: 18,
    };
    const car = carData[this.state.carId];
    const energy = car.battUsable * (this.state.socEnd - this.state.socStart) / 100 ;
    const chargingTime = this.computeChargingTime(car, this.state.socStart, this.state.socEnd);
    const cost = this.computeChargingCost(chargingTime, 10);
    const addedRange = (energy * 1000) / this.state.efficiency;
    const totalRange = car.battUsable * this.state.socEnd * 10 / this.state.efficiency;

    return (
      <Container text >
        <AppHeader title={"DCFC Time Calculator Hello!"} />
        <CarSelector
            options={this.carOptions}
            defaultValue={this.state.carId}
            onChange={(value) => {
              this.handleCarChange(value);
            }}/>
          <label>Battery at start: {this.state.socStart} %</label>
          <ReactSimpleRange
            {...socOptions}
            defaultValue={this.state.socStart}
            onChange={(event) => {this.handleSOCChange("socStart", event.value)}}
        />

        <label>Battery at end: {this.state.socEnd} % (Vehicule range: {totalRange.toFixed(0)} km)</label>
        <ReactSimpleRange
          {...socOptions}
          defaultValue={this.state.socEnd}
          onChange={(event) => {this.handleSOCChange("socEnd", event.value)}}
        />

        <label>Efficiency: {this.state.efficiency} Wh/km</label>
        <ReactSimpleRange
          step={1}
          min={80}
          max={300}
          thumbSize={socOptions.thumbSize}
          defaultValue={this.state.efficiency}
          onChange={(event) => {this.handleEfficiencyChange(event.value)}}
        />

        <Button content='Reset' onClick={(event) => {this.handleReset()}}/>

        <Divider />
        <StatisticTable
          time={chargingTime}
          range={addedRange}
          cost={cost}
          kwh={energy}
        />
      </Container>
    );
  }
}

export default App;

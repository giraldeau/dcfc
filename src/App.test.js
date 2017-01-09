import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import polyval from 'compute-polynomial';

import carData from '../fit/result/cars.json';


describe('app', () => {
	it('renders without crashing', () => {
	  const div = document.createElement('div');
	  ReactDOM.render(<App />, div);
	});
	it('polyval leaf 24', () => {
		const leaf24 = carData.find((item) => {
			return item.label === "leaf24";
		});

		console.log(leaf24.f)

		const v1 = polyval(leaf24.f, 2.1);
		const v2 = polyval(leaf24.f, 16.8);
		console.log(v1 + " " + v2);
	});
});


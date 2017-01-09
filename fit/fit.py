#!/usr/bin/python3

import os
import json
import csv
from scipy import integrate
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from io import StringIO 

cars = [
	{ 
		"id": 0,
		"maker": "Chevrolet",
		"model": "Spark EV",
		"label": "sparkev",
		"battTotal": 19,
		"battUsable": 17.4,
		"path": "sparkev.csv"
	},
	{ 
		"id": 1,
		"maker": "Nissan",
		"model": "LEAF",
		"label": "leaf24",
		"battTotal": 24,
		"battUsable": 21.3,
		"path": "leaf24.csv"
	},
#	{ 
#		"id": 2,
#		"maker": "Nissan",
#		"model": "LEAF",
#		"label": "leaf30",
#		"battTotal": 30,
#		"battUsable": 27.5,
#		"path": "leaf30.csv"
#	},
]

base="data"
result="result"

def computeFit(car, deg=7, base="data", result="result"):
	data = pd.read_csv(os.path.join(base, car["path"]))
	if "kwh" in data:
		kwh = data["kwh"]
	elif "kw" in data:
		kwh = integrate.cumtrapz(data['kw'] / 3600, data['time'], initial=0)
	else: 
		return []
	fit = np.polyfit(kwh, data['time'], deg);
	time2 = np.polyval(fit, kwh)
	if os.path.exists(result):
		plt.figure()
		plt.plot(kwh, data['time'])
		plt.plot(kwh, time2)
		plt.savefig(os.path.join(result, car["label"] + "-time.png"))
		#err = time2 - data["time"]
		#plt.figure()
		#plt.plot(kwh, err)
		#plt.savefig("err.png")
	return fit

if not os.path.exists(result):
	os.makedirs(result)

for car in cars:
	fit = computeFit(car, 7, base, result)
	params = []
	for p in fit:
		params.append(p)

	car["f"] = params
	print("{} {}".format(car["label"], np.polyval(params, [0, 1, 10])))


with open(os.path.join(result, "cars.json"), "w") as out:
	json.dump(cars, out, indent=2)

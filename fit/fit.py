#!/usr/bin/python3

import os
import sys
import json
import math
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy import integrate

cars = [
    { 
        "id": 0,
        "maker": "Chevrolet",
        "model": "Bolt EV",
        "label": "boltev",
        "battTotal": 64.0,
        "battUsable": 60.0,
        "efficiency": 156,
        "path": "bolt.csv"
    },
    { 
        "id": 1,
        "maker": "Chevrolet",
        "model": "Spark EV",
        "label": "sparkev",
        "battTotal": 19.0,
        "battUsable": 17.4,
        "efficiency": 132,
        "path": "sparkev.csv"
    },
    { 
        "id": 2,
        "maker": "Nissan",
        "model": "LEAF",
        "label": "leaf24",
        "battTotal": 24.0,
        "battUsable": 21.3,
        "efficiency": 160,
        "path": "leaf24.csv"
    },
    { 
        "id": 3,
        "maker": "Nissan",
        "model": "LEAF",
        "label": "leaf30",
        "battTotal": 30,
        "battUsable": 27.5,
        "efficiency": 160,
        "path": "leaf30.csv"
    },
    { 
        "id": 4,
        "maker": "BMW",
        "model": "i3",
        "label": "bmwi3-33",
        "battTotal": 33,
        "battUsable": 28.2,
        "efficiency": 154,
        "path": "bmwi3-33.csv"
    }
]

base="data"
result="result"

# We expect CSV data with kw or kwh data according to time in seconds
def loadData(car, base="data", result="result"):
    data = pd.read_csv(os.path.join(base, car["path"]))
    col = data.columns
    print(col)
    
    if not "time" in col:
        if "time_m" in col:
            data["time"] = data['time_m'] * 60
        else:
            raise RuntimeError("No time or time_m col found")
    if not "kwh" in col:
        if "kw" in col:
            data["kwh"] = integrate.cumtrapz(data['kw'] / 3600, data['time'], initial=0)
        elif "soc" in col:
            data["kwh"] = data["soc"] / 100.0 * car["battUsable"]
        else:
            raise RuntimeError(car["label"])
    return data

# pretty trivial polyfit
def computePolyFit(x, y, deg):
    return np.polyfit(x, y, deg);

# monotonic fit prevents negative charge time
# TODO
def computeMonotonicFit(x, y, deg):
    return computePolyFit(x, y, deg)

fitting = {
    "lsqfit": computeMonotonicFit,
    "polyfit": computePolyFit
}

def is_monotonic(x):
    for i in range(len(x) - 1):
        if x[i] > x[i + 1]:
            return False
    return True

def test():
    x = np.asarray([0.2096, -3.5761, -0.6252, -3.7951, -3.3525, -3.7001, -3.7086, -3.5907])
    d = np.asarray([95.7750, 94.9917, 90.8417, 62.6917, 95.4250, 89.2417, 89.4333, 82.0250])
    degree = 3
    n_data = len(d)
    n_deriv = 20; 
    xd = np.linspace(min(x), max(x), n_deriv)
    b = np.zeros((20, 1))
    C = np.zeros((n_data, degree + 1))
    A = np.zeros((n_deriv, degree + 1))
    
    for i in range(degree + 1):
        C[:, i] = x ** (i)
        A[:, i] = i * (xd ** (i - 1))
    
    print("xd:\n {}".format(xd))
    print("b:\n {}".format(b))
    print("C:\n {}".format(C))
    print("A:\n {}".format(A))
    
    p1 = np.linalg.lstsq(C, d)
    print("p1:\n {}".format(p1))
    
    sys.exit(0)

if __name__=="__main__":

    #test()

    # make sure the output directory exists
    if not os.path.exists(result):
        os.makedirs(result)

    # compute fit for each car
    cars_data = []
    for car in cars:
        data = loadData(car)
        cars_data.append(data);
        (x, y) = (data["kwh"], data["time"])
        for fit_method, func in fitting.items():
            fit = func(x, y, 5)
            coeff = [x for x in fit]
            car[fit_method] = coeff
            print("{} {} {}".format(car["label"], fit_method, np.polyval(coeff, [0, 1, 10])))

    # write results for the react app
    with open(os.path.join(result, "cars.json"), "w") as out:
        json.dump(cars, out, indent=2)

    # generate charts
    plt.figure()
    plt.ylabel('time (s)')
    plt.xlabel('energy (kWh)')
    plt.title("Time according to battery State of Charge (samples)")
    for i, car in enumerate(cars):
        data = cars_data[i]
        plt.plot(data["kwh"], data['time'])
    plt.savefig(os.path.join(result, "all-cars-samples.png"))

    for fit_method in fitting.keys():
        plt.figure()
        plt.ylabel("time (s)")
        plt.xlabel("energy (kWh)")
        plt.title("Time according to battery State of Charge ({})".format(fit_method))
        for car in cars:
            coeff = car[fit_method]
            mmax = car["battUsable"]
            x = np.linspace(0, mmax, 100)
            y = np.polyval(coeff, x)
            plt.plot(x, y)
            # check that data is monotonic
            print("{} {} is_monotonic: {}".format(car["label"], fit_method, is_monotonic(y)))
        plt.savefig(os.path.join(result, "all-cars-{}.png".format(fit_method)))

    for i, car in enumerate(cars):
        data = cars_data[i]
        fit_method = "polyfit"
        coeff = car[fit_method]

        plt.figure()
        plt.ylabel('time (s)')
        plt.xlabel('energy (kWh)')
        plt.title("Time according to battery State of Charge ({} {})".format(car["label"], fit_method))
        print(car["label"])
       
        y0 = np.polyval(coeff, 0)
        plt.plot(data["kwh"], data['time'] - y0, 'x')
        
        mmax = car["battUsable"]
        x = np.linspace(0, mmax, 100)
        # zero at the origin
        coeff[-1] = 0
        y1 = np.polyval(coeff, x)
        
        plt.plot(x, y1)
        
        plt.savefig(os.path.join(result, "{}-{}.png".format(car["label"], fit_method)))

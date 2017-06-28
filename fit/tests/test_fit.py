import numpy as np
from scipy.optimize import fmin
import matplotlib.pyplot as plt

def test_dot():
    t1 = np.array([[1, 2],[3, 4]])
    t2 = np.array([[2, 3],[4, 5]])
    # matrix multiply
    t3 = np.dot(t1, t2)
    # element-wise multiply
    t4 = t1 * t2
    print("t3:\n{}".format(t3))
    print("t4:\n{}".format(t4))

def test_fliplr():
    t = np.array([1, 2, 3, 4, 5])
    print("fliplr:{}\n".format(np.fliplr([t])[0]))

def test_lsqfit():
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
    
    p1 = np.dot(np.linalg.pinv(C), d)

    p12 = np.dot(C, p1)
    p13 = p12 - d
    lsqe = np.sum(np.square(p13))
    print("lsqe:{}\n".format(lsqe))
    
    def errfn(p):
        s1 = np.dot(C, p)
        s2 = s1 - d
        s3 = np.square(s2)
        sqe = np.sum(s3)
        der = np.dot(A, p);
        der_neg = np.select([der<0], [der])
        pen = -np.sum(der_neg) * 10 * lsqe
        print(pen)
        return sqe + pen
    
    p1 = np.fliplr([p1])[0]
    print("p1:\n {}".format(p1))
    
    p2 = np.polyfit(x, d, degree);
    print("p2:\n {}".format(p2))
    
    p3 = fmin(errfn, p1)
    print("p3:\n {}".format(p3))

    p3 = fmin(errfn, p1)
    print("p3:\n {}".format(p3))
    
    xx = np.arange(np.min(x), np.max(x), 0.1)
    plt.plot(x, d, 'x')
    plt.plot(xx, np.polyval(p2, xx))
    plt.plot(xx, np.polyval(p3, xx))
    plt.show()
    
    
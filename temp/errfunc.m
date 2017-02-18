function e = errfunc(A, C, p, d, lsqe)
    % squared error 
    sqe = sum((C*p - d).^2);
    der = A*p;

    % penalty term - it is crucial to fine tune it
    pen = -sum(der(der<0))*10*lsqe;

    e   = sqe + pen;
endfunction

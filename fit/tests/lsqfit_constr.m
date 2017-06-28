function lsqfit_constr
% Following lsqlin's notations

%--------------------------------------------------------------------------
% PRE-PROCESSING
%--------------------------------------------------------------------------
% for reproducibility
rng(125)
degree  = 3;

% data from comment
x       = [0.2096 -3.5761 -0.6252 -3.7951 -3.3525 -3.7001 -3.7086 -3.5907].';
d       = [95.7750 94.9917 90.8417 62.6917 95.4250 89.2417 89.4333 82.0250].';
n_data  = length(d);

% number of equally spaced points to enforce the derivative
n_deriv = 20;
xd      = linspace(min(x), max(x), n_deriv);

% limit on derivative - in each data point
b       = zeros(n_deriv,1);

% coefficient matrix
C       = nan(n_data, degree+1);
% derivative coefficient matrix
A       = nan(n_deriv, degree);

% loop over polynom terms
for ii  = 1:degree+1
    C(:,ii) = x.^(ii-1);
    A(:,ii) = (ii-1)*xd.^(ii-2);
end

%--------------------------------------------------------------------------
% FIT - LSQ
%--------------------------------------------------------------------------
% Unconstrained
% p1 = pinv(C)*y
p1      = (C\d);
lsqe    = sum((C*p1 - d).^2)

p2      = polyfit(x,d,degree);

% Constrained
pen_data = {};
[p3, fval] = fminunc(@error_fun, p1);
% pen_data

% correct format for polyval
p1      = fliplr(p1.')
p2
p3      = fliplr(p3.')
fval

%--------------------------------------------------------------------------
% PLOT
%--------------------------------------------------------------------------
xx      = linspace(-4,1,100);

plot(x, d, 'x')
hold on
plot(xx, polyval(p1, xx))
plot(xx, polyval(p2, xx),'--')
plot(xx, polyval(p3, xx))

% legend('data', 'lsq-pseudo-inv', 'lsq-polyfit', 'lsq-constrained', 'Location', 'southoutside')
xlabel('X')
ylabel('Y')

%--------------------------------------------------------------------------
% NESTED FUNCTION
%--------------------------------------------------------------------------
    function e = error_fun(p)
        % squared error 
        sqe = sum((C*p - d).^2);
        der = A*p

        % penalty term - it is crucial to fine tune it
        pen = -sum(der(der<0))*10*lsqe;
        pen_data = [pen_data, pen];
        e   = sqe + pen;
    end
end
---
title: "Lab 12: Heteroscedasticity"
subtitle: "Econometrics I - YTU"
author: 
  name: "Prof. Dr. Hüseyin Taştan"
  affiliation: "Yıldız Technical University"
# date: "02 Ekim 2020"
date: 2020 Fall
output: 
  html_document:
    number_sections: true
    theme: readable
    highlight: haddock 
    # code_folding: show
    toc: yes
    toc_depth: 3
    toc_float: yes
    keep_md: true
---
<style type="text/css"> 
body{
  font-size: 12pt;
}
code.r{
  font-size: 12pt;
}
</style>



# Heteroscedasticity-robust Statistical Inference  

(Note: both heteroscedasticity and heteroskedasticity are valid spellings.)

See Wooldridge ch.8 for formulas. 
To implement these we can use **car** package in R. 

## Example:  
 

```r
library(wooldridge)
# load packages (which need to be installed!)
library(lmtest) 
```

```
## Loading required package: zoo
```

```
## 
## Attaching package: 'zoo'
```

```
## The following objects are masked from 'package:base':
## 
##     as.Date, as.Date.numeric
```

```r
library(car)
```

```
## Loading required package: carData
```

```r
# Estimate model (only for spring data)
reg <- lm(cumgpa ~ sat + hsperc + tothrs + female + black + white, 
          data=gpa3, subset=(spring==1))
# Usual SE:
coeftest(reg)
# Refined White heteroscedasticity-robust SE:
coeftest(reg, vcov=hccm)
```

```
## 
## t test of coefficients:
## 
##                Estimate  Std. Error t value  Pr(>|t|)    
## (Intercept)  1.47006477  0.22980308  6.3971 4.942e-10 ***
## sat          0.00114073  0.00017856  6.3885 5.197e-10 ***
## hsperc      -0.00856636  0.00124042 -6.9060 2.275e-11 ***
## tothrs       0.00250400  0.00073099  3.4255 0.0006847 ***
## female       0.30343329  0.05902033  5.1412 4.497e-07 ***
## black       -0.12828368  0.14737012 -0.8705 0.3846164    
## white       -0.05872173  0.14098956 -0.4165 0.6772953    
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
## 
## 
## t test of coefficients:
## 
##                Estimate  Std. Error t value  Pr(>|t|)    
## (Intercept)  1.47006477  0.22938036  6.4089 4.611e-10 ***
## sat          0.00114073  0.00019532  5.8402 1.169e-08 ***
## hsperc      -0.00856636  0.00144359 -5.9341 6.963e-09 ***
## tothrs       0.00250400  0.00074930  3.3418   0.00092 ***
## female       0.30343329  0.06003964  5.0539 6.911e-07 ***
## black       -0.12828368  0.12818828 -1.0007   0.31762    
## white       -0.05872173  0.12043522 -0.4876   0.62615    
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

F-tests: 


```r
# F-Tests using different variance-covariance formulas:
myH0 <- c("black","white")
# Variance-Covariance (VCOV) using the standard formula
linearHypothesis(reg, myH0)
# Refined White VCOV
linearHypothesis(reg, myH0, vcov=hccm)
# Classical White VCOV
linearHypothesis(reg, myH0, vcov=hccm(reg, type="hc0"))
```

```
## Linear hypothesis test
## 
## Hypothesis:
## black = 0
## white = 0
## 
## Model 1: restricted model
## Model 2: cumgpa ~ sat + hsperc + tothrs + female + black + white
## 
##   Res.Df    RSS Df Sum of Sq      F Pr(>F)
## 1    361 79.362                           
## 2    359 79.062  2   0.29934 0.6796 0.5075
## Linear hypothesis test
## 
## Hypothesis:
## black = 0
## white = 0
## 
## Model 1: restricted model
## Model 2: cumgpa ~ sat + hsperc + tothrs + female + black + white
## 
## Note: Coefficient covariance matrix supplied.
## 
##   Res.Df Df      F Pr(>F)
## 1    361                 
## 2    359  2 0.6725 0.5111
## Linear hypothesis test
## 
## Hypothesis:
## black = 0
## white = 0
## 
## Model 1: restricted model
## Model 2: cumgpa ~ sat + hsperc + tothrs + female + black + white
## 
## Note: Coefficient covariance matrix supplied.
## 
##   Res.Df Df      F Pr(>F)
## 1    361                 
## 2    359  2 0.7478 0.4741
```


# Heteroscedasticity Tests 

## Breusch-Pagan (BP) Test Example: House price model 

Automatic computation of the BP het. test using bptest function in lmtest package: 


```r
# Estimate model
reg <- lm(price ~ lotsize + sqrft + bdrms, data=hprice1)
reg

# Automatic BP test
library(lmtest)
bptest(reg)
```

```
## 
## Call:
## lm(formula = price ~ lotsize + sqrft + bdrms, data = hprice1)
## 
## Coefficients:
## (Intercept)      lotsize        sqrft        bdrms  
##  -21.770308     0.002068     0.122778    13.852522  
## 
## 
## 	studentized Breusch-Pagan test
## 
## data:  reg
## BP = 14.092, df = 3, p-value = 0.002782
```

Manual computation: 


```r
# Manual regression of squared residuals 
summary(lm( resid(reg)^2 ~ lotsize + sqrft + bdrms, data=hprice1))
```

```
## 
## Call:
## lm(formula = resid(reg)^2 ~ lotsize + sqrft + bdrms, data = hprice1)
## 
## Residuals:
##    Min     1Q Median     3Q    Max 
##  -9044  -2212  -1256    -97  42582 
## 
## Coefficients:
##               Estimate Std. Error t value Pr(>|t|)   
## (Intercept) -5.523e+03  3.259e+03  -1.694  0.09390 . 
## lotsize      2.015e-01  7.101e-02   2.838  0.00569 **
## sqrft        1.691e+00  1.464e+00   1.155  0.25128   
## bdrms        1.042e+03  9.964e+02   1.046  0.29877   
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
## 
## Residual standard error: 6617 on 84 degrees of freedom
## Multiple R-squared:  0.1601,	Adjusted R-squared:  0.1301 
## F-statistic: 5.339 on 3 and 84 DF,  p-value: 0.002048
```

From these results, the LM statistic is $$LM=88\times 0.1601 =14.09\sim~\chi^2 (3) $$

**Exercise:** Compute the p-value for LM. 

**Exercise:** Re-run the BP tests using the logarithmic version of the house price model (see class notes). 

## White Test Example: House price model

We can use lmtest package to compute the White test. 
Here is an example using the log house prices. We will use the second version of the White test (which uses fitted values and their squares in the test regression)


```r
# Estimate model
reg <- lm(log(price) ~ log(lotsize) + log(sqrft) + bdrms, data=hprice1)
reg

# BP test
library(lmtest)
bptest(reg)

# White test
bptest(reg, ~ fitted(reg) + I(fitted(reg)^2) )
```

```
## 
## Call:
## lm(formula = log(price) ~ log(lotsize) + log(sqrft) + bdrms, 
##     data = hprice1)
## 
## Coefficients:
##  (Intercept)  log(lotsize)    log(sqrft)         bdrms  
##     -1.29704       0.16797       0.70023       0.03696  
## 
## 
## 	studentized Breusch-Pagan test
## 
## data:  reg
## BP = 4.2232, df = 3, p-value = 0.2383
## 
## 
## 	studentized Breusch-Pagan test
## 
## data:  reg
## BP = 3.4473, df = 2, p-value = 0.1784
```

The White test statistic is 3.4473 and p-value = 0.18. Thus, we fail to reject the null hypothesis of constant variance. 


# Weighted Least Squares 

FGLS estimation of cigarette demand: 

First: Estimate the model by OLS and check the BP test

```r
# OLS
olsreg<-lm(cigs ~ log(income) + log(cigpric) + educ +
             age + I(age^2) + restaurn, data = smoke)
olsreg
# BP test
library(lmtest)
bptest(olsreg)
```

```
## 
## Call:
## lm(formula = cigs ~ log(income) + log(cigpric) + educ + age + 
##     I(age^2) + restaurn, data = smoke)
## 
## Coefficients:
##  (Intercept)   log(income)  log(cigpric)          educ           age  
##    -3.639826      0.880268     -0.750862     -0.501498      0.770694  
##     I(age^2)      restaurn  
##    -0.009023     -2.825085  
## 
## 
## 	studentized Breusch-Pagan test
## 
## data:  olsreg
## BP = 32.258, df = 6, p-value = 1.456e-05
```

Second: Regress logaritmic squared residuals from the first step on all x variables: 

```r
# FGLS: estimation of the variance function
logu2 <- log(resid(olsreg)^2)
varreg<-lm(logu2 ~ log(income) + log(cigpric) + educ + 
             age + I(age^2) + restaurn, data=smoke)
varreg
```

```
## 
## Call:
## lm(formula = logu2 ~ log(income) + log(cigpric) + educ + age + 
##     I(age^2) + restaurn, data = smoke)
## 
## Coefficients:
##  (Intercept)   log(income)  log(cigpric)          educ           age  
##    -1.920693      0.291540      0.195419     -0.079704      0.204005  
##     I(age^2)      restaurn  
##    -0.002392     -0.627011
```

Third: Use the inverse of the exponentiated fitted values from the second step as weights:

```r
# FGLS: WLS
w <- 1/exp(fitted(varreg))
lm(cigs ~ log(income) + log(cigpric) + educ + 
     age + I(age^2) + restaurn, weight=w ,data=smoke)
```

```
## 
## Call:
## lm(formula = cigs ~ log(income) + log(cigpric) + educ + age + 
##     I(age^2) + restaurn, data = smoke, weights = w)
## 
## Coefficients:
##  (Intercept)   log(income)  log(cigpric)          educ           age  
##     5.635463      1.295239     -2.940312     -0.463446      0.481948  
##     I(age^2)      restaurn  
##    -0.005627     -3.461064
```





<div class="tocify-extend-page" data-unique="tocify-extend-page" style="height: 0;"></div>



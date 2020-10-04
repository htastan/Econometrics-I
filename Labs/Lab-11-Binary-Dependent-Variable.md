---
title: "Lab 11: Binary Dependent Variable"
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



# Linear Probability Model 

## Example: Women's Labor Force participation 

In this example (also see your classnotes) we are interested in examining the labor supply decisions of married working women. Here is the frequencies of those working and not working

```r
library(wooldridge)
data(mroz)
inlffac <- factor(mroz$inlf, labels = c("Not in the labor force","In the labor force"))
summary(inlffac)
```

```
## Not in the labor force     In the labor force 
##                    325                    428
```


Linear Probability Model (LPM) Estimation Results: 


```r
# Estimate linear probability model
linprob <- lm(inlf ~ nwifeinc + educ + exper + I(exper^2) +
                age + kidslt6 + kidsge6, data = mroz)
summary(linprob)
```

```
## 
## Call:
## lm(formula = inlf ~ nwifeinc + educ + exper + I(exper^2) + age + 
##     kidslt6 + kidsge6, data = mroz)
## 
## Residuals:
##      Min       1Q   Median       3Q      Max 
## -0.93432 -0.37526  0.08833  0.34404  0.99417 
## 
## Coefficients:
##               Estimate Std. Error t value Pr(>|t|)    
## (Intercept)  0.5855192  0.1541780   3.798 0.000158 ***
## nwifeinc    -0.0034052  0.0014485  -2.351 0.018991 *  
## educ         0.0379953  0.0073760   5.151 3.32e-07 ***
## exper        0.0394924  0.0056727   6.962 7.38e-12 ***
## I(exper^2)  -0.0005963  0.0001848  -3.227 0.001306 ** 
## age         -0.0160908  0.0024847  -6.476 1.71e-10 ***
## kidslt6     -0.2618105  0.0335058  -7.814 1.89e-14 ***
## kidsge6      0.0130122  0.0131960   0.986 0.324415    
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
## 
## Residual standard error: 0.4271 on 745 degrees of freedom
## Multiple R-squared:  0.2642,	Adjusted R-squared:  0.2573 
## F-statistic: 38.22 on 7 and 745 DF,  p-value: < 2.2e-16
```

**Exercise**: Interpret the parameter estimates. Which ones are statistically insignificant?

**Note**: The standard errors are invalid due to heteroskedasticity. But we can use heteroskedasticity-robust standard errors. 

Besides being heteroskedastic by definition (which can be easily fixed), there are several shortcomings of LPM. For example, in LPM predicted probabilities can be negative or larger than one. To see this consider the following point predictions: 


```r
# predictions for two "extreme" women 
xpred <- list(nwifeinc=c(100,0), educ=c(5,17), exper=c(0,30),
              age=c(20,52), kidslt6=c(2,0), kidsge6=c(0,0))
predict(linprob,xpred)
```

```
##          1          2 
## -0.4104582  1.0428084
```

As we saw in class, we can use specialized models that restrict the predicted probabilities between 0 and 1. These are (1) logit model which uses logistic distribution as the link (or index) function, and (2) probit model which uses normal distribution as the link function.  

## Example: Mortgage Decisions

(see class notes for details)



```r
# load `AER` package and attach the HMDA data
library(AER)
```

```
## Warning: package 'AER' was built under R version 3.6.3
```

```
## Loading required package: car
```

```
## Loading required package: carData
```

```
## Loading required package: lmtest
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

```
## Loading required package: sandwich
```

```
## Warning: package 'sandwich' was built under R version 3.6.3
```

```
## Loading required package: survival
```

```r
data(HMDA)

# convert 'deny' to numeric
HMDA$deny <- as.numeric(HMDA$deny) - 1

# estimate a simple linear probabilty model
denymod1 <- lm(deny ~ pirat, data = HMDA)
denymod1
```

```
## 
## Call:
## lm(formula = deny ~ pirat, data = HMDA)
## 
## Coefficients:
## (Intercept)        pirat  
##    -0.07991      0.60353
```

Add ethnicity dummy 


```r
colnames(HMDA)[colnames(HMDA) == "afam"] <- "black"

# estimate the model
denymod2 <- lm(deny ~ pirat + black, data = HMDA)
coeftest(denymod2, vcov. = vcovHC)
```

```
## 
## t test of coefficients:
## 
##              Estimate Std. Error t value  Pr(>|t|)    
## (Intercept) -0.090514   0.033430 -2.7076  0.006826 ** 
## pirat        0.559195   0.103671  5.3939 7.575e-08 ***
## blackyes     0.177428   0.025055  7.0815 1.871e-12 ***
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```


# Logit Model

For mathematical details see the class notes. Let us see a numerical example using `R`. 

## Example: Women's Labor Force Participation


```r
# Estimate logit model
logitres <- glm(inlf ~ nwifeinc + educ + exper + I(exper^2)
                + age + kidslt6 + kidsge6,
                family = binomial(link=logit), data = mroz)
# Summary of results:
summary(logitres)
```

```
## 
## Call:
## glm(formula = inlf ~ nwifeinc + educ + exper + I(exper^2) + age + 
##     kidslt6 + kidsge6, family = binomial(link = logit), data = mroz)
## 
## Deviance Residuals: 
##     Min       1Q   Median       3Q      Max  
## -2.1770  -0.9063   0.4473   0.8561   2.4032  
## 
## Coefficients:
##              Estimate Std. Error z value Pr(>|z|)    
## (Intercept)  0.425452   0.860365   0.495  0.62095    
## nwifeinc    -0.021345   0.008421  -2.535  0.01126 *  
## educ         0.221170   0.043439   5.091 3.55e-07 ***
## exper        0.205870   0.032057   6.422 1.34e-10 ***
## I(exper^2)  -0.003154   0.001016  -3.104  0.00191 ** 
## age         -0.088024   0.014573  -6.040 1.54e-09 ***
## kidslt6     -1.443354   0.203583  -7.090 1.34e-12 ***
## kidsge6      0.060112   0.074789   0.804  0.42154    
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
## 
## (Dispersion parameter for binomial family taken to be 1)
## 
##     Null deviance: 1029.75  on 752  degrees of freedom
## Residual deviance:  803.53  on 745  degrees of freedom
## AIC: 819.53
## 
## Number of Fisher Scoring iterations: 4
```

Compare **predictions** from LPM and logit (using previously defined xpred)


```r
predict(linprob,  xpred,type = "response")
predict(logitres, xpred,type = "response")
```

```
##          1          2 
## -0.4104582  1.0428084 
##           1           2 
## 0.005218002 0.950049117
```

We need to compute partial effects to properly interpret the logit model. 
We need to insert $x$ values to compute these effects. One option is to use sample averages of explanatory variables. This is called Partial Effects at the Average (PEA). The other option is to evaluate predictions for all observations and then taking the average. This is called Average Partial Effect (APE). 
We can use mfx package to estimate these partial effects. APE can be computed using the atmean=FALSE option. PEA can be computed using the atmean=TRUE option. 


```r
# Automatic APE calculations with package mfx
library(mfx)
```

```
## Warning: package 'mfx' was built under R version 3.6.3
```

```
## Loading required package: MASS
```

```
## 
## Attaching package: 'MASS'
```

```
## The following object is masked from 'package:wooldridge':
## 
##     cement
```

```
## Loading required package: betareg
```

```
## Warning: package 'betareg' was built under R version 3.6.3
```

```r
logitmfx(inlf ~ nwifeinc + educ + exper + I(exper^2) + 
           age + kidslt6 + kidsge6, data=mroz, atmean=FALSE)
```

```
## Call:
## logitmfx(formula = inlf ~ nwifeinc + educ + exper + I(exper^2) + 
##     age + kidslt6 + kidsge6, data = mroz, atmean = FALSE)
## 
## Marginal Effects:
##                  dF/dx   Std. Err.       z     P>|z|    
## nwifeinc   -0.00381181  0.00153898 -2.4769  0.013255 *  
## educ        0.03949652  0.00846811  4.6641 3.099e-06 ***
## exper       0.03676411  0.00655577  5.6079 2.048e-08 ***
## I(exper^2) -0.00056326  0.00018795 -2.9968  0.002728 ** 
## age        -0.01571936  0.00293269 -5.3600 8.320e-08 ***
## kidslt6    -0.25775366  0.04263493 -6.0456 1.489e-09 ***
## kidsge6     0.01073482  0.01339130  0.8016  0.422769    
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

**Exercie:** Compute PEA and compare to APE. 

## Example: Mortgage Decisions 


```r
# Automatic APE calculations with package mfx
# estimate a Logit regression with multiple regressors
denylogit2 <- glm(deny ~ pirat + black, 
                  family = binomial(link = "logit"), 
                  data = HMDA)

coeftest(denylogit2, vcov. = vcovHC, type = "HC1")
```

```
## 
## z test of coefficients:
## 
##             Estimate Std. Error  z value  Pr(>|z|)    
## (Intercept) -4.12556    0.34597 -11.9245 < 2.2e-16 ***
## pirat        5.37036    0.96376   5.5723 2.514e-08 ***
## blackyes     1.27278    0.14616   8.7081 < 2.2e-16 ***
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

Average Partial effects: 


```r
# Automatic APE calculations with package mfx
library(mfx)
logitmfx(deny ~ pirat + black, data = HMDA, atmean=FALSE)
```

```
## Call:
## logitmfx(formula = deny ~ pirat + black, data = HMDA, atmean = FALSE)
## 
## Marginal Effects:
##             dF/dx Std. Err.      z     P>|z|    
## pirat    0.518278  0.078819 6.5756 4.847e-11 ***
## blackyes 0.166402  0.023866 6.9725 3.114e-12 ***
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
## 
## dF/dx is for discrete change for the following variables:
## 
## [1] "blackyes"
```





<div class="tocify-extend-page" data-unique="tocify-extend-page" style="height: 0;"></div>



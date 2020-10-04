---
title: "Lab 06: Statistical Inference in Multiple Linear Regression - Part 1"
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




# t-test Examples

## Wage Equation

The model is given by 
$$
\log(wage) = \beta_0 + \beta_1 educ + \beta_2 exper + \beta_3 tenure + u
$$
Estimate the model using `wage1 ` data. 

```r
library(wooldridge)
wagereg <- lm(log(wage) ~ educ + exper + tenure, data = wage1)
summary(wagereg) 
```

```
## 
## Call:
## lm(formula = log(wage) ~ educ + exper + tenure, data = wage1)
## 
## Residuals:
##      Min       1Q   Median       3Q      Max 
## -2.05802 -0.29645 -0.03265  0.28788  1.42809 
## 
## Coefficients:
##             Estimate Std. Error t value Pr(>|t|)    
## (Intercept) 0.284360   0.104190   2.729  0.00656 ** 
## educ        0.092029   0.007330  12.555  < 2e-16 ***
## exper       0.004121   0.001723   2.391  0.01714 *  
## tenure      0.022067   0.003094   7.133 3.29e-12 ***
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
## 
## Residual standard error: 0.4409 on 522 degrees of freedom
## Multiple R-squared:  0.316,	Adjusted R-squared:  0.3121 
## F-statistic: 80.39 on 3 and 522 DF,  p-value: < 2.2e-16
```
Test the statistical significance of the coefficient on exper against one-sided alternative, i.e., 
$$
H_0: \beta_2 = 0
$$
$$
H_1: \beta_2 > 0
$$

The t-statistic is already reported in the output, $t_{\hat{\beta}_2}=2.391$. We need 
to compare this to the critical value from the t distribution with dof=522 degrees of freedom. Let's find the critical values at 5% and 1% significance levels using R:  

```r
# CV for alpha=5% and 1% using the t distribution with 522 d.f.
# Using the quantile function for t (qt)
alpha <- c(0.05, 0.01)
qt(1-alpha, 522)

# Critical values for alpha=5% and 1% using the normal approximation:
# Using the quantile function for normal distribution (qnorm)
qnorm(1-alpha)
```

```
## [1] 1.647778 2.333513
## [1] 1.644854 2.326348
```

Recall that for large degrees of freedom (approximately dof>120), the normal approximation gives practically the same answer. This is no surprise because as the sample size increases (assuming the number of parameters remain the same), t distribution approaches the standard normal distribution. Thus, for large samples we can just use the standard normal critical values. 

Because the t test statistic is larger than the critical value, $t_{\hat{\beta}_2}=2.391>2.33$, at 1% significance level, we reject the null hypothesis in favor of the alternative. Although the coefficient estimate is small, it is statistically different from zero. 

We can find the p-value using the distribution function of t in R (pt): 

```r
pt(2.391,522, lower.tail = FALSE)
# or 
1-pt(2.391,522)
```

```
## [1] 0.008577905
## [1] 0.008577905
```

Note that this is half the p-value reported in the regression output. 
Because p-value<0.01, we can reject the null hypothesis at 1% significance level.

## Student Performance Model, level-level


```r
library(wooldridge)
sumres1 <- summary(lm(math10 ~ totcomp + staff + enroll, data = meap93))
regtable1 <- sumres1$coefficients
regtable1
```

```
##                  Estimate   Std. Error    t value     Pr(>|t|)
## (Intercept)  2.2740209322 6.1137937574  0.3719492 7.101257e-01
## totcomp      0.0004586119 0.0001003520  4.5700302 6.489312e-06
## staff        0.0479198735 0.0398140299  1.2035926 2.294518e-01
## enroll      -0.0001975613 0.0002152237 -0.9179348 3.592007e-01
```

Manual confirmation of test statistics: 

```r
bhat <- regtable1[,1]
se   <- regtable1[,2]

# Reproduce t statistic
( tstat <- bhat / se ) 
```

```
## (Intercept)     totcomp       staff      enroll 
##   0.3719492   4.5700302   1.2035926  -0.9179348
```

```r
# Reproduce p value
( pval  <- 2*pt(-abs(tstat),404) )
```

```
##  (Intercept)      totcomp        staff       enroll 
## 7.101257e-01 6.489312e-06 2.294518e-01 3.592007e-01
```

## Student Performance Model, level-log

```r
sumres2 <- summary (lm(math10 ~ log(totcomp) + log(staff) + log(enroll), data = meap93))
regtable2 <- sumres2$coefficients
regtable2
```

```
##                 Estimate Std. Error    t value     Pr(>|t|)
## (Intercept)  -207.664913 48.7031234 -4.2638931 2.503786e-05
## log(totcomp)   21.155011  4.0555488  5.2163128 2.922303e-07
## log(staff)      3.980016  4.1896602  0.9499615 3.426998e-01
## log(enroll)    -1.268048  0.6932039 -1.8292564 6.809812e-02
```

**Exercise**: Is log(enroll) statistically significant? Test this null hypothesis against the lower tail alternative hypothesis. Find the p-value and state your decision. 

## College GPA 

```r
( sumres <- summary( lm(colGPA ~ hsGPA+ACT+skipped, data=gpa1) ) )
```

```
## 
## Call:
## lm(formula = colGPA ~ hsGPA + ACT + skipped, data = gpa1)
## 
## Residuals:
##      Min       1Q   Median       3Q      Max 
## -0.85698 -0.23200 -0.03935  0.24816  0.81657 
## 
## Coefficients:
##             Estimate Std. Error t value Pr(>|t|)    
## (Intercept)  1.38955    0.33155   4.191 4.95e-05 ***
## hsGPA        0.41182    0.09367   4.396 2.19e-05 ***
## ACT          0.01472    0.01056   1.393  0.16578    
## skipped     -0.08311    0.02600  -3.197  0.00173 ** 
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
## 
## Residual standard error: 0.3295 on 137 degrees of freedom
## Multiple R-squared:  0.2336,	Adjusted R-squared:  0.2168 
## F-statistic: 13.92 on 3 and 137 DF,  p-value: 5.653e-08
```

```r
# Manually confirm the formulas: Extract coefficients and SE
regtable <- sumres$coefficients
bhat <- regtable[,1]
se   <- regtable[,2]

# Reproduce t statistic
( tstat <- bhat / se )
# Reproduce p value
( pval  <- 2*pt(-abs(tstat),137) )
```

```
## (Intercept)       hsGPA         ACT     skipped 
##    4.191039    4.396260    1.393319   -3.196840 
##  (Intercept)        hsGPA          ACT      skipped 
## 4.950269e-05 2.192050e-05 1.657799e-01 1.725431e-03
```

## Campus Crime Model 

```r
( crimeres <- summary( lm(log(crime) ~ log(enroll), data=campus) ) )
```

```
## 
## Call:
## lm(formula = log(crime) ~ log(enroll), data = campus)
## 
## Residuals:
##     Min      1Q  Median      3Q     Max 
## -4.5136 -0.3858  0.1174  0.4363  2.5782 
## 
## Coefficients:
##             Estimate Std. Error t value Pr(>|t|)    
## (Intercept)  -6.6314     1.0335  -6.416 5.44e-09 ***
## log(enroll)   1.2698     0.1098  11.567  < 2e-16 ***
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
## 
## Residual standard error: 0.8946 on 95 degrees of freedom
## Multiple R-squared:  0.5848,	Adjusted R-squared:  0.5804 
## F-statistic: 133.8 on 1 and 95 DF,  p-value: < 2.2e-16
```

## House prices 

```r
( houseres <- summary( lm(log(price) ~ log(nox)+log(dist)+rooms+stratio, data=hprice2) ) )
```

```
## 
## Call:
## lm(formula = log(price) ~ log(nox) + log(dist) + rooms + stratio, 
##     data = hprice2)
## 
## Residuals:
##      Min       1Q   Median       3Q      Max 
## -1.05890 -0.12427  0.02128  0.12882  1.32531 
## 
## Coefficients:
##              Estimate Std. Error t value Pr(>|t|)    
## (Intercept) 11.083861   0.318111  34.843  < 2e-16 ***
## log(nox)    -0.953539   0.116742  -8.168 2.57e-15 ***
## log(dist)   -0.134339   0.043103  -3.117  0.00193 ** 
## rooms        0.254527   0.018530  13.736  < 2e-16 ***
## stratio     -0.052451   0.005897  -8.894  < 2e-16 ***
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
## 
## Residual standard error: 0.265 on 501 degrees of freedom
## Multiple R-squared:  0.584,	Adjusted R-squared:  0.5807 
## F-statistic: 175.9 on 4 and 501 DF,  p-value: < 2.2e-16
```

# Confidence Interval Example: R&D Expenditures 
$$
\log (\mathrm{rd})=\beta_{0}+\beta_{1} \cdot \log (\mathrm{educ})+\beta_{2} \cdot \mathrm{profmarg}+u
$$

```r
# OLS regression:
myres <- lm(log(rd) ~ log(sales)+profmarg, data=rdchem)

# Regression output:
summary(myres)
```

```
## 
## Call:
## lm(formula = log(rd) ~ log(sales) + profmarg, data = rdchem)
## 
## Residuals:
##      Min       1Q   Median       3Q      Max 
## -0.97681 -0.31502 -0.05828  0.39020  1.21783 
## 
## Coefficients:
##             Estimate Std. Error t value Pr(>|t|)    
## (Intercept) -4.37827    0.46802  -9.355 2.93e-10 ***
## log(sales)   1.08422    0.06020  18.012  < 2e-16 ***
## profmarg     0.02166    0.01278   1.694    0.101    
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
## 
## Residual standard error: 0.5136 on 29 degrees of freedom
## Multiple R-squared:  0.918,	Adjusted R-squared:  0.9123 
## F-statistic: 162.2 on 2 and 29 DF,  p-value: < 2.2e-16
```


```r
# 95% CI:
confint(myres)
```

```
##                    2.5 %     97.5 %
## (Intercept) -5.335478450 -3.4210681
## log(sales)   0.961107256  1.2073325
## profmarg    -0.004487722  0.0477991
```

```r
# 99% CI:
confint(myres, level=0.99)
```

```
##                   0.5 %      99.5 %
## (Intercept) -5.66831270 -3.08823382
## log(sales)   0.91829920  1.25014054
## profmarg    -0.01357817  0.05688955
```



<div class="tocify-extend-page" data-unique="tocify-extend-page" style="height: 0;"></div>



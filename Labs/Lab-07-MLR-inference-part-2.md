---
title: "Lab 07: Statistical Inference in Multiple Linear Regression - Part 2"
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




# Testing a Single Linear Combination

## Example: 2-year vs. 4-year college education

Consider the model
$$
log(wage)=\beta_{0}+\beta_{1} jc+\beta_{2} univ+\beta_{3} exper+u
$$

The null and alternative hypotheses are 
$$
H_0: \beta_1 - \beta_2 = 0
$$
$$
H_0: \beta_1 - \beta_2 < 0
$$
First, estimate the model using `twoyear ` data. 

```r
library(wooldridge)
reg1 <- lm(lwage ~ jc + univ + exper, data = twoyear)
summary(reg1)
```

```
## 
## Call:
## lm(formula = lwage ~ jc + univ + exper, data = twoyear)
## 
## Residuals:
##      Min       1Q   Median       3Q      Max 
## -2.10362 -0.28132  0.00551  0.28518  1.78167 
## 
## Coefficients:
##              Estimate Std. Error t value Pr(>|t|)    
## (Intercept) 1.4723256  0.0210602  69.910   <2e-16 ***
## jc          0.0666967  0.0068288   9.767   <2e-16 ***
## univ        0.0768762  0.0023087  33.298   <2e-16 ***
## exper       0.0049442  0.0001575  31.397   <2e-16 ***
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
## 
## Residual standard error: 0.4301 on 6759 degrees of freedom
## Multiple R-squared:  0.2224,	Adjusted R-squared:  0.2221 
## F-statistic: 644.5 on 3 and 6759 DF,  p-value: < 2.2e-16
```
Write the SRF in equaton form with standard errors underneath the coefficient 
estimates: 
$$
 \widehat{lwage} = \underset{(0.021)} {1.47} + \underset{(0.0069)} {0.0667}~ jc + \underset{(0.0023)} {0.0769}~ univ +  \underset{(0.0002)} {0.0049}~ exper
 $$
 $$
 n=6763,~~~~R^2 = 0.22
$$
This reproduces equation (4.21) on p. 125 of our textbook (the results presented in 
class are different because we used a subsample of the original data set).

As we saw in class to compute the t-ratio, we need to estimate $se(\hat{\beta}_1 - \hat{\beta}_2)$. For this we define a 
new variable, totcoll = jc+univ, and estimate the following model (see the class notes).
$$
log(wage)=\beta_{0}+\theta jc+\beta_{2} totcoll+\beta_{3} exper+u
$$
where $\theta=\beta_1-\beta_2$. The standard error on $\theta$ is what we want to obtain from the following regression

```r
reg2 <- lm(lwage ~ jc + totcoll + exper, data = twoyear)
summary(reg2)
```

```
## 
## Call:
## lm(formula = lwage ~ jc + totcoll + exper, data = twoyear)
## 
## Residuals:
##      Min       1Q   Median       3Q      Max 
## -2.10362 -0.28132  0.00551  0.28518  1.78167 
## 
## Coefficients:
##               Estimate Std. Error t value Pr(>|t|)    
## (Intercept)  1.4723256  0.0210602  69.910   <2e-16 ***
## jc          -0.0101795  0.0069359  -1.468    0.142    
## totcoll      0.0768762  0.0023087  33.298   <2e-16 ***
## exper        0.0049442  0.0001575  31.397   <2e-16 ***
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
## 
## Residual standard error: 0.4301 on 6759 degrees of freedom
## Multiple R-squared:  0.2224,	Adjusted R-squared:  0.2221 
## F-statistic: 644.5 on 3 and 6759 DF,  p-value: < 2.2e-16
```
These results reproduce the equation (4.27) on page 126. From these results we get $se(jc)=0.0069$. Thus, the t statistic is simply
$t=-0.0102/0.0069=-1.48$. The p-value is 


```r
# p-value = Probability of obtaining t-value less than -1.48 (lower-tail test)
# given that t~dof=6759, practically standard normal
pt(-1.48,6759)
```

[1] 0.06945993

```r
# or using standard normal cdf
pnorm(-1.47,0,1)
```

[1] 0.07078088

Because p-value=0.07 is between 0.05 and 0.1, we fail to reject $H_0$ at $\alpha=0.05$ but reject at $\alpha=0.1$. As a result we may say there is some, but not strong, evidence against the null hypothesis. 

The previous auxiliary regression was estimated just to obtain the standard error of
$(\hat{\beta}_1 - \hat{\beta}_2)$. We can obtain that standard error more 
directly using the variance-covariance matrix of the coefficient estimates. Recall the 
formula for that standard error: 
$$
\operatorname{se}\left(\hat{\beta}_{1}-\hat{\beta}_{2}\right)=\sqrt{\operatorname{Var}\left(\hat{\beta}_{1}-\hat{\beta}_{2}\right)}=\sqrt{ \operatorname{Var}\left(\hat{\beta}_{1}\right)+\operatorname{Var}\left(\hat{\beta}_{2}\right)-2 \operatorname{Cov}\left(\hat{\beta}_{1}, \hat{\beta}_{2}\right) }
$$

After the estimation of the original model just run 

```r
reg1 <- lm(lwage ~ jc + univ + exper, data = twoyear)
covmat <- vcov(reg1)
covmat
```

```
##               (Intercept)            jc          univ         exper
## (Intercept)  4.435337e-04 -1.741432e-05 -1.573472e-05 -3.104756e-06
## jc          -1.741432e-05  4.663243e-05  1.927929e-06 -1.718296e-08
## univ        -1.573472e-05  1.927929e-06  5.330230e-06  3.933491e-08
## exper       -3.104756e-06 -1.718296e-08  3.933491e-08  2.479792e-08
```
The main diagonal entries are the variances of associated coefficient estimates. 
If you take the square root of the main diagonal you'd get the individual standard errors: 

```r
sqrt(diag(covmat)) 
```

```
##  (Intercept)           jc         univ        exper 
## 0.0210602393 0.0068287940 0.0023087290 0.0001574735
```
Compare these values to those underneath the SRF and regression output. The off-diagonal entries of the covmat are just covariances between the pairs of coefficient estimates. For example, $cov(\hat{\beta}_1,~ \hat{\beta}_2)=1.927929e-06=0.000001928$. Plugging into our standard error formula we get 
$$
se(\hat{\beta}_1 - \hat{\beta}_2)=\sqrt{ 0.0000466 + 0.00000533-2\times 0.000001928} \approx 0.0069 
$$
which is what we found using the auxiliary regression approach. Note that using 
the structure of the covmat we can directly compute this using R: 

```r
sqrt( covmat[2,2] + covmat[3,3] - 2*covmat[2,3] )
```

```
## [1] 0.006935907
```

Note that we can also define a $4\times 1$ selection matrix $v = [0, 1,-1,0]$ and compute the standard error of the linear combination using $v' S v$ where $S$ is the covariance matrix (covmat): 


```r
v <- matrix(c(0,1,-1,0),nrow=4,ncol=1)
v
```

     [,1]
[1,]    0
[2,]    1
[3,]   -1
[4,]    0

```r
sqrt( t(v) %*% covmat %*% v )
```

            [,1]
[1,] 0.006935907

# F-test Approach

We can also test the null hypothesis $H_0: \beta_1 - \beta_2 = 0$ using an F-test. 
We need to estimate two regressions: unrestricted and restricted, and then plug in the respective SSR values in the F test formula and use the associated decision rule.

The Unrestricted model was estimated above: 

```r
unrest <- lm(lwage ~ jc + univ + exper, data = twoyear)
anova(unrest)
USSR <- sum(unrest$residuals^2)
USSR
```

```
## Analysis of Variance Table
## 
## Response: lwage
##             Df  Sum Sq Mean Sq F value    Pr(>F)    
## jc           1    7.98   7.983  43.148 5.451e-11 ***
## univ         1  167.38 167.381 904.668 < 2.2e-16 ***
## exper        1  182.39 182.389 985.783 < 2.2e-16 ***
## Residuals 6759 1250.54   0.185                      
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
## [1] 1250.544
```

The Unrestricted Sum of Squared Residuals is $USSR = 1250.544$. Now, we need to estimate the Restricted regression.
Under the null hypothesis (in other words if the null is correct), we must have 
$\beta_1 = \beta_2$. This implies that 

\begin{eqnarray} 
  log(wage) &=& \beta_{0}+\beta_{1} jc+\beta_{1} univ+\beta_{3} exper+u \\
            &=& \beta_{0}+\beta_{1} (jc+univ) + \beta_{3} exper+u \\
            &=& \beta_{0}+\beta_{1} totcoll + \beta_{3} exper+u
\end{eqnarray}

where $totcoll=jc+univ$. The restricted regression is: 

```r
rest <- lm(lwage ~ totcoll + exper, data = twoyear)
anova(rest)
RSSR <- sum(rest$residuals^2)
RSSR
```

```
## Analysis of Variance Table
## 
## Response: lwage
##             Df  Sum Sq Mean Sq F value    Pr(>F)    
## totcoll      1  175.36 175.359  947.63 < 2.2e-16 ***
## exper        1  181.99 181.995  983.49 < 2.2e-16 ***
## Residuals 6760 1250.94   0.185                      
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
## [1] 1250.942
```

Now we are ready to compute the F-statistic. Using the formula we learned in class: 
$$
F=\frac{RSSR-USSR}{USSR}\cdot \frac{n-k-1}{q}=\frac{1250.942-1250.544}{1250.544}\cdot \frac{6763-3-1}{1} = 2.154336 \sim ~F(1,6759)
$$
where $q=1$ is the number of restrictions. R computations: 

```r
n <- length(unrest$residuals)
k <- length(unrest$coefficients)-1
q <- 1
F <- ((RSSR-USSR)/USSR) * (n-k-1)/q
F
```

[1] 2.154017



When the number of linear restrictions is just $1$ we know that the square of the t-statistic is equal to the F statistic: 
$$
t_{n-k-1}^2 = F(1,n-q-1)
$$

Exercise: verify the relationship above (note: pay attention to rounding errors). 


# Exclusion Restrictions 

## Example (data=bwght)

We are interested in whether mother's and father's education levels are jointly 
significant in a model for the weight of newly born babies. We first estimate the unrestricted model. But before that we need to drop observations with missing values on 
father's education level: 


```r
data(bwght, package='wooldridge')
# omit missing observations (many missing values in fatheduc)
bwght <- na.omit(bwght)
```

Now we can estimate the unrestricted model: 

```r
unrest.bwght <- lm(bwght ~  cigs + parity + faminc + motheduc + fatheduc, data=bwght)
summary(unrest.bwght)
```

```
## 
## Call:
## lm(formula = bwght ~ cigs + parity + faminc + motheduc + fatheduc, 
##     data = bwght)
## 
## Residuals:
##     Min      1Q  Median      3Q     Max 
## -95.796 -11.960   0.643  12.679 150.879 
## 
## Coefficients:
##              Estimate Std. Error t value Pr(>|t|)    
## (Intercept) 114.52433    3.72845  30.716  < 2e-16 ***
## cigs         -0.59594    0.11035  -5.401 8.02e-08 ***
## parity        1.78760    0.65941   2.711  0.00681 ** 
## faminc        0.05604    0.03656   1.533  0.12559    
## motheduc     -0.37045    0.31986  -1.158  0.24702    
## fatheduc      0.47239    0.28264   1.671  0.09492 .  
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
## 
## Residual standard error: 19.79 on 1185 degrees of freedom
## Multiple R-squared:  0.03875,	Adjusted R-squared:  0.03469 
## F-statistic: 9.553 on 5 and 1185 DF,  p-value: 5.986e-09
```

Exclude motheduc and fatheduc and estimate the restricted model: 

```r
rest.bwght <- lm(bwght ~  cigs + parity + faminc, data=bwght)
summary(rest.bwght)
```

```
## 
## Call:
## lm(formula = bwght ~ cigs + parity + faminc, data = bwght)
## 
## Residuals:
##     Min      1Q  Median      3Q     Max 
## -95.811 -11.552   0.524  12.739 150.848 
## 
## Coefficients:
##              Estimate Std. Error t value Pr(>|t|)    
## (Intercept) 115.46993    1.65590  69.733  < 2e-16 ***
## cigs         -0.59785    0.10877  -5.496 4.74e-08 ***
## parity        1.83227    0.65754   2.787  0.00541 ** 
## faminc        0.06706    0.03239   2.070  0.03865 *  
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
## 
## Residual standard error: 19.8 on 1187 degrees of freedom
## Multiple R-squared:  0.03642,	Adjusted R-squared:  0.03398 
## F-statistic: 14.95 on 3 and 1187 DF,  p-value: 1.472e-09
```

Hand calculations to compute the F statistic: 

```r
n <- length(unrest.bwght$residuals)
k.unrest <- length(unrest.bwght$coefficients)-1
k.rest <- length(rest.bwght$coefficients)-1
q <- k.unrest - k.rest
q
```

[1] 2

```r
USSR <- sum(unrest.bwght$residuals^2)
RSSR <- sum(rest.bwght$residuals^2)
F <- ((RSSR-USSR)/USSR) * (n - k.unrest - 1)/q
F
```

[1] 1.437269

Because the dependent variable is the same in the restricted model, we can also use the $R^2$ version of the F-statistic. 

```r
# Unrestricted model's Rsquared
URsq <- summary(unrest.bwght)$r.squared
# Restricted model's Rsquared
RRsq <- summary(rest.bwght)$r.squared
# Compute the F statistic
F <- ((URsq-RRsq)/(1-URsq)) * (n - k.unrest - 1)/q
F
```

[1] 1.437269


The decision rule: reject F if the computed test statistic larger than F(q,n-k-1) critical value at some $\alpha$ level. E.g., 5% c.v. is: 

Critical Value at 5% significance level: 

```r
alpha <- 0.05
Fcv05 <- qf(alpha, q, n-k.unrest-1, lower.tail = FALSE)
Fcv05
```

[1] 3.003318

Note that this is the same as 

```r
qf(1-alpha, q, n-k.unrest-1, lower.tail = TRUE)
```

[1] 3.003318

F critical value at $\alpha = 0.1$: 

```r
qf(0.9, q, n-k.unrest-1)
```

[1] 2.307065

Because calculated F statistic is less than the C.V. at 10% we fail to reject the null hypothesis. Mother's and father's education levels are **jointly insignificant**.

Let's calculate the p-value: 

```r
# p-value 
1-pf(F,q,n-k.unrest-1)
```

[1] 0.2379896

Because p-value=0.238>0.1, we do not reject $H_0$. 


# F testing using `linearHypothesis()` function

F-test for linear restrictions is widely used in practice. User-written R function, 
`linearHypothesis `, which is a part of R package `car ` can be used to carry out F tests. For example, to test the null hypothesis above use the following command: 


```r
# install.packages("car")
library(car)
```

```
## Loading required package: carData
```

```r
linearHypothesis(unrest.bwght, c("motheduc=0","fatheduc=0"))
```

```
## Linear hypothesis test
## 
## Hypothesis:
## motheduc = 0
## fatheduc = 0
## 
## Model 1: restricted model
## Model 2: bwght ~ cigs + parity + faminc + motheduc + fatheduc
## 
##   Res.Df    RSS Df Sum of Sq      F Pr(>F)
## 1   1187 465167                           
## 2   1185 464041  2    1125.7 1.4373  0.238
```


# F-test Example: House Price Valuations 

Estimate the Unrestricted model: 

```r
data(hprice1, package='wooldridge')
# unrestricted regression
unrest <- lm(lprice ~  lassess + llotsize + lsqrft + bdrms, data=hprice1)
summary(unrest)
anova(unrest)
```

```
## 
## Call:
## lm(formula = lprice ~ lassess + llotsize + lsqrft + bdrms, data = hprice1)
## 
## Residuals:
##      Min       1Q   Median       3Q      Max 
## -0.53337 -0.06333  0.00686  0.07836  0.60825 
## 
## Coefficients:
##              Estimate Std. Error t value Pr(>|t|)    
## (Intercept)  0.263743   0.569665   0.463    0.645    
## lassess      1.043065   0.151446   6.887 1.01e-09 ***
## llotsize     0.007438   0.038561   0.193    0.848    
## lsqrft      -0.103238   0.138430  -0.746    0.458    
## bdrms        0.033839   0.022098   1.531    0.129    
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
## 
## Residual standard error: 0.1481 on 83 degrees of freedom
## Multiple R-squared:  0.7728,	Adjusted R-squared:  0.7619 
## F-statistic: 70.58 on 4 and 83 DF,  p-value: < 2.2e-16
## 
## Analysis of Variance Table
## 
## Response: lprice
##           Df Sum Sq Mean Sq  F value Pr(>F)    
## lassess    1 6.1385  6.1385 279.7090 <2e-16 ***
## llotsize   1 0.0030  0.0030   0.1378 0.7114    
## lsqrft     1 0.0031  0.0031   0.1394 0.7098    
## bdrms      1 0.0515  0.0515   2.3449 0.1295    
## Residuals 83 1.8215  0.0219                    
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```
Save the Unrestricted SSR and other quantities 

```r
SSRu <- sum(unrest$residuals^2)
SSRu
```

```
## [1] 1.821529
```
Estimate the Restricted model 

```r
# restricted regression
# define the new dependent variable 
pricedif <- hprice1$lprice - hprice1$lassess
rest <- lm(pricedif ~  1, data=hprice1) 
anova(rest)
# Restricted SSR 
SSRr <- sum(resid(rest)^2)
SSRr
```

```
## Analysis of Variance Table
## 
## Response: pricedif
##           Df Sum Sq  Mean Sq F value Pr(>F)
## Residuals 87 1.8801 0.021611               
## [1] 1.880149
```
Now compute the F statistic: 


```r
n <- nobs(unrest)
k <- length(unrest$coefficients)-1
q <- 4
F <- ((SSRr-SSRu)/SSRu) * (n-k-1)/q
F
```

[1] 0.6677722

The decision rule: reject $H_0$ if the computed test statistic larger than F(q,n-k-1) critical value at some $\alpha$ level. E.g., 5% c.v. is: 


```r
alpha <- 0.05
Fcv05 <- qf(alpha, q, n-k-1, lower.tail = FALSE)
Fcv05
```

[1] 2.481661

or

```r
qf(1-alpha, q, n-k-1, lower.tail = TRUE)
```

[1] 2.481661

And the p-value is 

```r
1-pf(F,q,n-k-1)
```

[1] 0.6161596

P-value is larger than any reasonable levels of significance. Thus, we fail to reject the null hypothesis. 

Automatic computation of F-statistic: 

```r
linearHypothesis(unrest, c("lassess=1","llotsize=0","lsqrft=0","bdrms=0"))
```

```
## Linear hypothesis test
## 
## Hypothesis:
## lassess = 1
## llotsize = 0
## lsqrft = 0
## bdrms = 0
## 
## Model 1: restricted model
## Model 2: lprice ~ lassess + llotsize + lsqrft + bdrms
## 
##   Res.Df    RSS Df Sum of Sq      F Pr(>F)
## 1     87 1.8801                           
## 2     83 1.8215  4   0.05862 0.6678 0.6162
```

# Lagrange Multiplier (LM) Test Example: data=bwght

LM Test of exclusion restrictions using bwght data example. Following the steps 
we learned in class we obtain: 


```r
# 1. Estimate restricted model:
restr <- lm(bwght ~ cigs + parity + faminc, data=bwght) 

# 2. Regression of residuals from restricted model:
uhatrest <- resid(restr)
# Regress residuals on ALL variables: 
LMreg <- lm(uhatrest ~  cigs + parity + faminc + motheduc + fatheduc, data=bwght)

# R-squared from the 2nd step
R2 <- summary(LMreg)$r.squared 
R2
```

[1] 0.0024199

```r
# 3. Compute the LM test statistic:
LM <- R2 * nobs(LMreg)
LM
```

[1] 2.882101

Compute the p-value (Remember $LM\sim~\chi^2(q)$). In our case the number of 
restrictions is $q=2$. 

```r
1-pchisq(LM, 2)
```

[1] 0.236679

P-value is larger than reasonable levels of significance. Thus, we do not reject $H_0$. 

Exercise: What is the critical value at 5% level. State your decision rule and decision. 

# Reporting Regression Results 

Reproduce Table 4.1 on page 138 (need to install `stargazer` package) 


```r
data(meap93, package='wooldridge')

# define new variable within data frame
meap93$b_s <- meap93$benefits / meap93$salary

# Estimate three different models
model1<- lm(log(salary) ~ b_s                       , data=meap93)
model2<- lm(log(salary) ~ b_s+log(enroll)+log(staff), data=meap93)
model3<- lm(log(salary) ~ b_s+log(enroll)+log(staff)+droprate+gradrate
                                                    , data=meap93)
# Load package and display table of results
# install.packages("stargazer")
library(stargazer)
```

```
## 
## Please cite as:
```

```
##  Hlavac, Marek (2018). stargazer: Well-Formatted Regression and Summary Statistics Tables.
```

```
##  R package version 5.2.2. https://CRAN.R-project.org/package=stargazer
```

```r
stargazer(list(model1,model2,model3),type="text",keep.stat=c("n","rsq"))
```

```
## 
## ==========================================
##                   Dependent variable:     
##              -----------------------------
##                       log(salary)         
##                 (1)       (2)       (3)   
## ------------------------------------------
## b_s          -0.825*** -0.605*** -0.589***
##               (0.200)   (0.165)   (0.165) 
##                                           
## log(enroll)            0.087***  0.088*** 
##                         (0.007)   (0.007) 
##                                           
## log(staff)             -0.222*** -0.218***
##                         (0.050)   (0.050) 
##                                           
## droprate                          -0.0003 
##                                   (0.002) 
##                                           
## gradrate                           0.001  
##                                   (0.001) 
##                                           
## Constant     10.523*** 10.844*** 10.738***
##               (0.042)   (0.252)   (0.258) 
##                                           
## ------------------------------------------
## Observations    408       408       408   
## R2             0.040     0.353     0.361  
## ==========================================
## Note:          *p<0.1; **p<0.05; ***p<0.01
```




<div class="tocify-extend-page" data-unique="tocify-extend-page" style="height: 0;"></div>



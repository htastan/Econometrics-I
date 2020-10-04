---
title: "Lab 01: Introduction to R and RStudio"
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



# R and RStudio Environment

`RStudio` provides an excellent interface that makes working with `R` whole lot easier. If you haven't done so, please first install the latest version of `R` before you install RStudio. 

1. Visit [The Comprehensive R Archive Network](https://cran.r-project.org/) to download and install `R`. You should be able to see something like: 

![](img/Rimage1.PNG) 

At this stage, you can actually start using basic functions of R, for example,  

![](img/Rimage2.PNG)

But there is a much easier alternative to run and manage R programs. `RStudio` provides an excellent IDE. Now, go ahead and

2. Visit [RStudio](https://rstudio.com/), download the latest version and install. 

Now, you're ready to launch RStudio. You will see 4 windows. 

![](img/Rimage3.PNG)
<br/>

To open a new `R` script file, Click File > New File > R script. This will be your first R script. `R` script is basically a text file in which you organize your commands and codes. 

The bottom left window is the command "Console" in which you can execute your 
codes. For example, you can use R as a calculator, define and draw functions. 

# R Console

On the console just type

```r
2 + 2
```

```
## [1] 4
```

```r
pi
```

```
## [1] 3.141593
```

Or


```r
log(exp(-5))
```

```
## [1] -5
```

```r
e <- exp(1)
print(e, digits = 3)
```

```
## [1] 2.72
```

```r
e <- exp(1)
print(e, digits = 17)
```

```
## [1] 2.7182818284590451
```

Well, no surprises there. Now let's try computing the number $a = (9\times 8.1) + 8.1$ which is simply 
$10\times 8.1 = 81$. Because multiplication has precedence over addition unless there is a parenthesis,  we have

```r
a <- 9*8.1 + 8.1
print(a)
```

```
## [1] 81
```

But look at the digits after zero: 

```r
print(a, digits = 17)
```

```
## [1] 80.999999999999986
```

This means the number 81 cannot be represented exactly in a computer which uses binary representation. The error in representing 81 is 

```r
print(81-a, digits = 17)
```

```
## [1] 1.4210854715202004e-14
```

which is just $1.4210854715202004\times 10^{-14}$,  or 

```r
format(81-a, scientific = FALSE)
```

```
## [1] "0.00000000000001421085"
```

Is this a problem? Well, it depends on your purpose and context. Suppose that you wanted to compare the output of the arithmetic operation to a known result. We can use logical operators for that (more on this below). Consider 

```r
81 == a
```

```
## [1] FALSE
```

This is just another way of saying that two numbers are not exactly equal. But they are nearly equal:  

```r
all.equal(81,a)
```

```
## [1] TRUE
```

with the default tolerance level of $0.000000015$. In other words, the difference between 81 and the number `a` is less than the tolerance level. In passing, I note that the machine precision (sometimes called epsilon, $\epsilon$) in R is 

```r
print(.Machine$double.eps, digits=22)
```

```
## [1] 2.2204460492503131e-16
```

**Exercise:** Find the largest number that can be represented in the computer smaller than 1. 



Other arithmetic operations can be problematic as well. Try subtracting 10.1 from 10.2: 

```r
b <- 10.2 - 10.1
print(b, digits = 17)
```

```
## [1] 0.099999999999999645
```

which is not exactly $0.10$. 

**Exercise** Show that the binary representation of 81 is $(1010001)$, i.e., $(81)_{10} = (1010001)_2$. Also find the binary representation of $0.10$. 


# Packages

The base `R` comes with the following packages: 

```r
rownames(installed.packages(priority="base"))
```

```
##  [1] "base"      "compiler"  "datasets"  "graphics"  "grDevices" "grid"     
##  [7] "methods"   "parallel"  "splines"   "stats"     "stats4"    "tcltk"    
## [13] "tools"     "utils"
```

`R`'s functionality can easily be extended by including software packages written by other `R` users. For example, we can install the data package for our textbook by typing the following code at the very top of the script (mind the quotation mark):


```r
install.packages("wooldridge", repos='http://cran.us.r-project.org')
```

Alternatively, this can be done using `Tools>InstallPackages` from the menu and then typing "Wooldridge" on the search window. We basically downloaded this package into our computer. Now we can activate whenever we need it. To tell `R` that we will use we need a further command:


```r
library(wooldridge)
```

This instructs `R` that our code needs to access contents of that package. Note that there is no quotation mark. 

# File Names and Working Directory

Use `getwd()` to see the current directory. If we want to change 
it we can use setwd(path) where path should be defined usign forward slash /, instead of backslash, \. 

```r
getwd()
```
 If we want to change 
it we can use `setwd("/full/address/")` where path should be defined using forward slash `/`, instead of backslash, `\`. 

```r
setwd("C:/Users/Folder/Another-Folder/Econometrics-1")
```


# Objects in `R` 

`R` is case-sensitive so `x` and `X` are different objects. The content of an object is assigned using `<-` for example: 


```r
x <- 5 
y <- 2 
z <- x^y 
z 
```

```
## [1] 25
```

Note that the equation sign can also be used but I suggest using `<-` (don't forget to put a single space before and after). 

List of all currently available objects in the memory can be accessed using the command `ls()`


```r
ls()
```

```
## [1] "a" "b" "e" "x" "y" "z"
```

Also see the `Environment` window in RStudio. 

The command `rm(x)` removes the object `x` from the memory. If you want to remove all objects, you can use `rm(list=ls())`. 


```r
rm(list=ls())
ls()
```

```
## character(0)
```


## Vectors 

An `R` vector (or an atomic vector -not an algebraic vector-) is just a collection of objects. A vector my contain numeric elements (integers and doubles), logicals, and characters. A vector can be defined in a number of ways. For example, we can use `c()` to create vectors `a` and `b`  


```r
a <- c(1,2,3,4,5)
a
```

```
## [1] 1 2 3 4 5
```

```r
b <- c(1,1,1,1,1)
a+b
```

```
## [1] 2 3 4 5 6
```

```r
integer <- c(10L, 20L)
typeof(a)
```

```
## [1] "double"
```

```r
typeof(integer)
```

```
## [1] "integer"
```


```r
char1 <- c("small", "medium", "large")
char1
```

```
## [1] "small"  "medium" "large"
```

```r
typeof(char1)
```

```
## [1] "character"
```

Let `score` be a vector with 10 elements containing evaluations on a new product out of 100 points. 


```r
score <- c(80, 65, 78, 94, 100, NA, 55, 85, 88, 75)
print(score)
```

```
##  [1]  80  65  78  94 100  NA  55  85  88  75
```

```r
NROW(score)
```

```
## [1] 10
```

```r
length(score)
```

```
## [1] 10
```


Some of the widely used `R` functions for vectors are illustrated below:


```r
# number of elements in a vector 
length(a)
```

```
## [1] 5
```

```r
# sort elements 
sort(score)
```

```
## [1]  55  65  75  78  80  85  88  94 100
```

```r
# maximum 
max(a)
```

```
## [1] 5
```

```r
# minimum
min(a)
```

```
## [1] 1
```

```r
# sum of the elements 
sum(a)
```

```
## [1] 15
```

```r
# product of the elements 
prod(a)
```

```
## [1] 120
```

```r
# vector of n zeros
numeric(5)
```

```
## [1] 0 0 0 0 0
```

```r
# create an n-vector with all elements a: rep(a, n)
rep(1,10)
```

```
##  [1] 1 1 1 1 1 1 1 1 1 1
```

```r
# seq(T): create an integer sequence from 1 to T
seq(10)
```

```
##  [1]  1  2  3  4  5  6  7  8  9 10
```

```r
# seq(t,T) similarly create a sequence from t to T
seq(5,10)
```

```
## [1]  5  6  7  8  9 10
```

```r
# seq(t,T,s) create a sequence from t to T by increment s
seq(1,10,2)
```

```
## [1] 1 3 5 7 9
```

The elements of a vector can easily be accessed. 

```r
# first element 
score[1]
```

```
## [1] 80
```

```r
# first three elements
score[1:3]
```

```
## [1] 80 65 78
```

```r
# last element 
n <- length(score)
score[n]
```

```
## [1] 75
```

```r
# last three elements
score[(n-3):n]
```

```
## [1] 55 85 88 75
```

**Exercise** Instead of running `score[(n-3):n]` use `score[n-3:n]`

```r
score[n-3:n]
```

```
## [1]  55  NA 100  94  78  65  80
```

Explain the output above. 

**Exercise** Find the index of `NA` in the vector `score` and eliminate it. Call the new vector `score2`. 

**Solution** The easiest way is to use two built-in functions `which()` and `is.na()` together. `is.na()` returns `TRUE` (more on that below) for `NA` entries, and `FALSE` otherwise.

```r
# is an element NA ?
is.na(score)
```

```
##  [1] FALSE FALSE FALSE FALSE FALSE  TRUE FALSE FALSE FALSE FALSE
```

`which()` returns the index number, i.e., the position of the `NA` element in the vector. 

```r
# what's the position of NA 
which(is.na(score))
```

```
## [1] 6
```

Or, find the positions of entries that are not `NA`: 

```r
# indices of numeric elements (excluding NAs)
which(!is.na(score))
```

```
## [1]  1  2  3  4  5  7  8  9 10
```

where we simply used the negation `!is.na()`. Now, exclude `NA` and create a new vector: 

```r
score2 <- score[which(!is.na(score))]
score2
```

```
## [1]  80  65  78  94 100  55  85  88  75
```

Actually, using `which()` is redundant in this case (unless we want to retain intermediate steps): 

```r
score2 <- score[!is.na(score)]
score2
```

```
## [1]  80  65  78  94 100  55  85  88  75
```

The function `na.omit()` can also be used to drop missing observations (to be discussed later).  

A vector with **logical elements**: 

```r
logic1 <- c(TRUE, FALSE, TRUE)
print(logic1) 
```

```
## [1]  TRUE FALSE  TRUE
```

Note that `TRUE` and `FALSE` are reserved in `R`. Here is the numerical representation of a logical vector: 

```r
as.numeric(logic1) 
```

```
## [1] 1 0 1
```

We can use logical operators, `==`, `>`, `<`, `>=`, `<=` ,`!=`, to create vectors with logical entries. For example, 

```r
score_less_than70 <- (score < 70)
score_less_than70
```

```
##  [1] FALSE  TRUE FALSE FALSE FALSE    NA  TRUE FALSE FALSE FALSE
```

We can easily extract the contents of `score` than satisfy `score<70` using logical subscripting. 

```r
score
```

```
##  [1]  80  65  78  94 100  NA  55  85  88  75
```

```r
score[score_less_than70]
```

```
## [1] 65 NA 55
```



## Matrices 

We can create matrices in a number of ways. If we want to create a matrix based on an existing vector we can use the following command:


```r
A <- matrix(data=score, nrow=10, ncol=1, byrow=FALSE, dimnames=NULL)
print(A)
dim(A)
```

```
##       [,1]
##  [1,]   80
##  [2,]   65
##  [3,]   78
##  [4,]   94
##  [5,]  100
##  [6,]   NA
##  [7,]   55
##  [8,]   85
##  [9,]   88
## [10,]   75
## [1] 10  1
```

We can change the dimensions of the matrix, for example: 


```r
B <- matrix(data=score, nrow=5, ncol=2, byrow=FALSE, dimnames=NULL)
print(B)
dim(B)
```

```
##      [,1] [,2]
## [1,]   80   NA
## [2,]   65   55
## [3,]   78   85
## [4,]   94   88
## [5,]  100   75
## [1] 5 2
```

which gives us a $5\times 2$ matrix using `byrow=FALSE` option. 

The transpose of a matrix can be found using `t()` function:   


```r
t(B)
```

```
##      [,1] [,2] [,3] [,4] [,5]
## [1,]   80   65   78   94  100
## [2,]   NA   55   85   88   75
```

The position of the missing element can be accessed using 

```r
is.na(B)
```

```
##       [,1]  [,2]
## [1,] FALSE  TRUE
## [2,] FALSE FALSE
## [3,] FALSE FALSE
## [4,] FALSE FALSE
## [5,] FALSE FALSE
```

```r
# the position of NA
which(is.na(B))
```

```
## [1] 6
```

The position is determined column-wise. For example, consider the following 

```r
C <- t(B)
is.na(C)
```

```
##       [,1]  [,2]  [,3]  [,4]  [,5]
## [1,] FALSE FALSE FALSE FALSE FALSE
## [2,]  TRUE FALSE FALSE FALSE FALSE
```

```r
# the position of NA
which(is.na(C))
```

```
## [1] 2
```


Sometimes we want to create a blank matrix to be filled later in a loop. For example, 
to create a matrix of zeros use


```r
zeros <- matrix(data = 0, nrow = 5, ncol = 5)
```

The functions `cbind` and `rbind` can be used to create rectangular arrays (matrices). For example 


```r
x <- cbind(b,a)
# also check out the following
cbind(1,1:5)
```

```
##      [,1] [,2]
## [1,]    1    1
## [2,]    1    2
## [3,]    1    3
## [4,]    1    4
## [5,]    1    5
```

Let us define another column vector that contains gender:


```r
gender <- c("Female", "Male", "Female", "Female", "Male", "Female", "Male", "Male", "Female", "Female")
print(gender) 
table(gender)
```

```
##  [1] "Female" "Male"   "Female" "Female" "Male"   "Female" "Male"   "Male"  
##  [9] "Female" "Female"
## gender
## Female   Male 
##      6      4
```

Think of `gender` as a categorical variable. Each observation is assigned to a gender category. 


Let us combine these two pieces of information, scores and gender, and call it `x`: 


```r
x<- cbind(score,gender)
x
```

```
##       score gender  
##  [1,] "80"  "Female"
##  [2,] "65"  "Male"  
##  [3,] "78"  "Female"
##  [4,] "94"  "Female"
##  [5,] "100" "Male"  
##  [6,] NA    "Female"
##  [7,] "55"  "Male"  
##  [8,] "85"  "Male"  
##  [9,] "88"  "Female"
## [10,] "75"  "Female"
```

Note that all elements are strings (why?). 

You can save these objects for later use: 


```r
save(score, gender, B, b, x, file = "myfirstRdata.RData")
```

Reload them using: 

```r
load("myfirstRdata.RData")
```

We combine vectors and matrices having the same dimensions into a special type of object called data frame. For example


```r
mydata<- data.frame(score,gender)
mydata
names(mydata)
str(mydata)
summary(mydata)
```

```
##    score gender
## 1     80 Female
## 2     65   Male
## 3     78 Female
## 4     94 Female
## 5    100   Male
## 6     NA Female
## 7     55   Male
## 8     85   Male
## 9     88 Female
## 10    75 Female
## [1] "score"  "gender"
## 'data.frame':	10 obs. of  2 variables:
##  $ score : num  80 65 78 94 100 NA 55 85 88 75
##  $ gender: Factor w/ 2 levels "Female","Male": 1 2 1 1 2 1 2 2 1 1
##      score        gender 
##  Min.   : 55   Female:6  
##  1st Qu.: 75   Male  :4  
##  Median : 80             
##  Mean   : 80             
##  3rd Qu.: 88             
##  Max.   :100             
##  NA's   :1
```

We will revisit data frames in the next lab session. 

## Logical vectors revisited

As we mentioned above, `TRUE` and `FALSE` are reserved words in `R` indicating whether a given statement is true or false. Internally, `TRUE` (T) is set to 1 and `FALSE` (F) is set to 0. Try the following commands yourself

```r
# logical operators, ==, !=, >, <, >=, <=
0 == 0
```

```
## [1] TRUE
```

```r
0 == 1
```

```
## [1] FALSE
```

```r
a >= 3
```

```
## [1] FALSE FALSE  TRUE  TRUE  TRUE
```

```r
# note what happens if you type 
1-(a<=3)
```

```
## [1] 0 0 0 1 1
```

We can create logical vectors using the function `logical()`, or using conditional statements on existing vectors. For example, 

```r
# logical creates a vector in which each element is zero
logical(5)
```

```
## [1] FALSE FALSE FALSE FALSE FALSE
```

```r
# Which observations are Male
gender=="Male"
```

```
##  [1] FALSE  TRUE FALSE FALSE  TRUE FALSE  TRUE  TRUE FALSE FALSE
```

```r
# indicate scores higher than or equal to 75
ind <- (score>=75)
cbind(score, ind)
```

```
##       score ind
##  [1,]    80   1
##  [2,]    65   0
##  [3,]    78   1
##  [4,]    94   1
##  [5,]   100   1
##  [6,]    NA  NA
##  [7,]    55   0
##  [8,]    85   1
##  [9,]    88   1
## [10,]    75   1
```


## Lists 

A __list__ is a general grouping of any kind of objects in `R` and it can have different types of the components. 

```r
# Generate a list object:
mylist <- list( A=seq(8,36,4), this="that", idm = diag(3))
# Print the list: 
mylist
```

```
## $A
## [1]  8 12 16 20 24 28 32 36
## 
## $this
## [1] "that"
## 
## $idm
##      [,1] [,2] [,3]
## [1,]    1    0    0
## [2,]    0    1    0
## [3,]    0    0    1
```

In order to name the components __names()__ command may be used.

```r
names(mylist)
```

```
## [1] "A"    "this" "idm"
```

Also a specific component can be refered by __list_name$component_name__.

```r
# Print component "A":
mylist$A
```

```
## [1]  8 12 16 20 24 28 32 36
```



# Conditional Execution
If we want to run our code under certain conditions we can use `if` `else` statements. The usage is as follows: 

```r
if (condition) {
  code fragment
} else {
    code fragment
  }
```

For example, 

```r
a <- seq(1,10,1)
b <- 85
c <- "YTU"
if (typeof(b)=="double" |  typeof(b)=="integer") {
  print(b) } else {
    print("This is not a numeric object")
  }
```

```
## [1] 85
```

```r
x <- -10
if ( x < 0 ) {
  print("x is a negative number") } else {
    print("x is a positive number")
  }
```

```
## [1] "x is a negative number"
```

# Loops
We can easily execute repeated computation using `for` loop. The usage as follows:  

```r
for (loopvar in vector) { 
  }
```

The loop variable(`loopvar`) takes each value in the specified `vector`, one after another. For example,  

```r
for (i in 1:5) { 
  print(i) 
  }
```

The following example will take each element in the sequence of 1:10 and produce the square or square root of the element, depending on whether it is less than 5.

```r
for (i in 1:10){
  if (i<5) {print(i^2)}
  else {print(sqrt(i))}
}
```

```
## [1] 1
## [1] 4
## [1] 9
## [1] 16
## [1] 2.236068
## [1] 2.44949
## [1] 2.645751
## [1] 2.828427
## [1] 3
## [1] 3.162278
```
 

# Visualization: Defining and drawing curves

On the console type `help(curve)` or `?curve`: 

```r
?curve
```

```r
# a linear function
curve(1+2*x, from=-2, to=2, xlab="x", ylab="" )
# add a quadratic function
curve(1+2*x-2*x^2, add = TRUE, col = "red" )
# cubic
curve(1+2*x-2*x^2+3*x^3, add = TRUE, col = "blue" )
```

![](Lab-01-Intro-to-R-and-RStudio_files/figure-html/unnamed-chunk-64-1.png)<!-- -->

Another way of visualizing an algebraic function is to use `function()` and `curve()` or `plot()` together. 

```r
# Define the function (this is your first function here !)
fun1 <- function(x) 2*sin(x)+cos(x)
curve(fun1, -pi, pi, n = 100) 
```

![](Lab-01-Intro-to-R-and-RStudio_files/figure-html/unnamed-chunk-65-1.png)<!-- -->

```r
# focus on the interval -2 < x < 2
plot(fun1, -2, 2)
```

![](Lab-01-Intro-to-R-and-RStudio_files/figure-html/unnamed-chunk-66-1.png)<!-- -->

<div class="tocify-extend-page" data-unique="tocify-extend-page" style="height: 0;"></div>


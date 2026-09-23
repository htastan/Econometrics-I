# Helpers for writing estimated equations in "textbook form":
# coefficients with standard errors underneath in parentheses.
#
# Usage inside a .qmd (display math with inline R):
#   $$ `r eq_se(res, "\\log(wage)")` $$
#
# Arguments
#   m      a fitted lm object
#   lhs    LaTeX for the dependent variable (shown with a hat)
#   digits significant digits for estimates and standard errors
#   stats  add n and R-squared after the equation
#   breaks positions (term numbers, 1 = first slope) after which to break the line

# |x| >= 1: two decimals (e.g. 207.66); |x| < 1: `digits` significant digits (e.g. 0.000459)
fmt_num <- function(x, digits = 3) {
  if (abs(x) >= 1) return(formatC(x, format = "f", digits = 2))
  s <- formatC(x, digits = digits, format = "fg", flag = "#")
  sub("\\.$", "", trimws(s))
}

tex_name <- function(nm) {
  nm <- gsub("^log\\((.*)\\)$", "\\\\log(\\1)", nm)
  nm <- gsub("^I\\((.*)\\^2\\)$", "\\1^2", nm)
  nm <- gsub("_", "\\\\_", nm)
  nm
}

eq_se <- function(m, lhs, digits = 3, stats = TRUE, breaks = integer(0), se2 = NULL) {
  cf <- coef(m)
  se <- sqrt(diag(vcov(m)))
  out <- character(0)
  for (j in seq_along(cf)) {
    b <- cf[j]
    # \small inside \underset keeps the standard errors readable when projected
    term <- sprintf("\\underset{\\small (%s)}{%s}", fmt_num(se[j], digits), fmt_num(abs(b), digits))
    # a second line of standard errors (e.g. robust), in square brackets underneath
    if (!is.null(se2)) term <- sprintf("\\underset{\\small [%s]}{%s}", fmt_num(se2[j], digits), term)
    if (names(cf)[j] != "(Intercept)") term <- paste0(term, "\\,", tex_name(names(cf)[j]))
    sign <- if (b < 0) "-" else if (j == 1) "" else "+"
    out <- c(out, paste(sign, term))
    if ((j - 1) %in% breaks) out <- c(out, "\\\\ &")
  }
  body <- paste(out, collapse = " ")
  # the alignment point is this "=", so write it directly: `lhs` may contain "=" itself
  res <- sprintf("\\widehat{%s} &= %s", lhs, body)
  if (stats) {
    res <- paste0(res, sprintf(" \\\\ & n = %d,\\quad R^2 = %s", nobs(m), fmt_num(summary(m)$r.squared, 3)))
  }
  sprintf("\\begin{aligned} %s \\end{aligned}", res)
}

# Same idea for a fitted glm: the index function goes inside G(.), with the
# standard errors under the coefficients. `lhs` is the probability being modeled.
#   $$ `r eq_glm(logit_h, "P(deny = 1\\mid \\mathbf{x})")` $$
eq_glm <- function(m, lhs, digits = 3, stats = TRUE, breaks = integer(0)) {
  cf <- coef(m)
  se <- sqrt(diag(vcov(m)))
  link <- m$family$link
  G <- if (link == "probit") "\\Phi" else if (link == "logit") "\\Lambda" else "G"
  out <- character(0)
  for (j in seq_along(cf)) {
    b <- cf[j]
    term <- sprintf("\\underset{\\small (%s)}{%s}", fmt_num(se[j], digits), fmt_num(abs(b), digits))
    if (names(cf)[j] != "(Intercept)") term <- paste0(term, "\\,", tex_name(names(cf)[j]))
    sign <- if (b < 0) "-" else if (j == 1) "" else "+"
    out <- c(out, paste(sign, term))
    if ((j - 1) %in% breaks) out <- c(out, "\\\\ &\\quad")
  }
  res <- sprintf("\\widehat{%s} &= %s\\left( %s \\right)", lhs, G, paste(out, collapse = " "))
  if (stats) {
    r2 <- 1 - as.numeric(logLik(m)) / as.numeric(logLik(update(m, . ~ 1)))
    res <- paste0(res, sprintf(" \\\\ & n = %d,\\quad \\text{pseudo } R^2 = %s,\\quad \\log L = %s",
                               nobs(m), fmt_num(r2, 3), fmt_num(as.numeric(logLik(m)), 4)))
  }
  sprintf("\\begin{aligned} %s \\end{aligned}", res)
}

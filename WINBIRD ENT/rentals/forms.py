from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.password_validation import validate_password
from django.forms import BaseFormSet, BaseInlineFormSet, formset_factory, inlineformset_factory

from .models import Booking, Inventory, Payment, PriceOption, RentalItem

User = get_user_model()


# =============================
# STYLING MIXIN
# =============================
class StyledFieldsMixin:
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            widget = field.widget
            if isinstance(widget, forms.CheckboxInput):
                widget.attrs["class"] = "form-check-input"
            elif isinstance(widget, forms.Select):
                widget.attrs["class"] = "form-select"
            elif isinstance(widget, forms.Textarea):
                widget.attrs["class"] = "form-control"
                widget.attrs.setdefault("rows", 4)
            else:
                widget.attrs["class"] = "form-control"


# =============================
# LOGIN
# =============================
class LoginForm(StyledFieldsMixin, AuthenticationForm):
    username = forms.CharField(widget=forms.TextInput(attrs={"placeholder": "Staff username"}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={"placeholder": "Password"}))


# =============================
# RENTAL ITEM
# =============================
class RentalItemForm(StyledFieldsMixin, forms.ModelForm):
    class Meta:
        model = RentalItem
        fields = ["name", "is_active"]

# =============================
# INVENTORY
# =============================
class InventoryForm(StyledFieldsMixin, forms.ModelForm):
    class Meta:
        model = Inventory
        fields = ["quantity_total", "quantity_available"]
        widgets = {
            "quantity_total": forms.NumberInput(attrs={"min": 0}),
            "quantity_available": forms.NumberInput(attrs={"min": 0}),
        }


# =============================
# PRICE OPTION (SINGLE ONLY)
# =============================
class PriceOptionForm(StyledFieldsMixin, forms.ModelForm):
    class Meta:
        model = PriceOption
        fields = ["label", "amount", "is_default", "is_active"]
        widgets = {
            "amount": forms.NumberInput(attrs={"step": "0.01", "min": 0})
        }

    def clean(self):
        cleaned_data = super().clean()

        label = cleaned_data.get("label")
        amount = cleaned_data.get("amount")

        if not label:
            self.add_error("label", "Enter a label.")

        if amount in (None, ""):
            self.add_error("amount", "Enter amount.")

        return cleaned_data


class BasePriceOptionFormSet(BaseInlineFormSet):
    def clean(self):
        super().clean()

        if not self.forms:
            raise forms.ValidationError("Add a price option.")

        form = self.forms[0]

        if not hasattr(form, "cleaned_data"):
            return

        if not form.cleaned_data.get("label") or form.cleaned_data.get("amount") in (None, ""):
            raise forms.ValidationError("Price label and amount are required.")

        if not form.cleaned_data.get("is_default"):
            raise forms.ValidationError("Default price must be selected.")


PriceOptionFormSet = inlineformset_factory(
    RentalItem,
    PriceOption,
    form=PriceOptionForm,
    formset=BasePriceOptionFormSet,
    extra=1,
    can_delete=False,
    min_num=1,
    validate_min=True,
    max_num=1,
    validate_max=True,
)


# =============================
# BOOKING FORM
# =============================
class BookingCreateForm(StyledFieldsMixin, forms.ModelForm):
    customer_name = forms.CharField(max_length=150)
    customer_phone = forms.CharField(max_length=30)

    class Meta:
        model = Booking
        fields = ["event_date", "return_due_date", "notes"]
        widgets = {
            "event_date": forms.DateInput(attrs={"type": "date"}),
            "return_due_date": forms.DateInput(attrs={"type": "date"}),
            "notes": forms.Textarea(attrs={"placeholder": "Optional notes"}),
        }


# =============================
# BOOKING ITEMS
# =============================
class RentalItemChoiceField(forms.ModelChoiceField):
    def label_from_instance(self, obj):
        return f"{obj.name} (Stock: {obj.quantity_total})"


class PriceOptionChoiceField(forms.ModelChoiceField):
    def label_from_instance(self, obj):
        return f"{obj.rental_item.name} - {obj.label} (GHS {obj.amount:.2f})"


class BookingItemForm(StyledFieldsMixin, forms.Form):
    rental_item = RentalItemChoiceField(queryset=RentalItem.objects.filter(is_active=True))
    price_option = PriceOptionChoiceField(queryset=PriceOption.objects.filter(is_active=True))
    quantity = forms.IntegerField(min_value=1)

    def clean(self):
        cleaned_data = super().clean()
        rental_item = cleaned_data.get("rental_item")
        price_option = cleaned_data.get("price_option")

        if rental_item and price_option and price_option.rental_item_id != rental_item.id:
            self.add_error("price_option", "Wrong price option selected.")

        return cleaned_data


class BaseBookingItemFormSet(BaseFormSet):
    def clean(self):
        if any(self.errors):
            return

        valid = 0

        for form in self.forms:
            if not form.cleaned_data:
                continue
            if form.cleaned_data.get("DELETE"):
                continue

            valid += 1

        if valid == 0:
            raise forms.ValidationError("Add at least one item.")


BookingItemFormSet = formset_factory(
    BookingItemForm,
    formset=BaseBookingItemFormSet,
    extra=1,
    can_delete=True,
)


# =============================
# PAYMENT
# =============================
class PaymentForm(StyledFieldsMixin, forms.ModelForm):
    class Meta:
        model = Payment
        fields = ["amount", "paid_on", "notes"]
        widgets = {
            "amount": forms.NumberInput(attrs={"step": "0.01"}),
            "paid_on": forms.DateInput(attrs={"type": "date"}),
        }


# =============================
# STAFF ACCOUNT
# =============================
class StaffAccountForm(StyledFieldsMixin, forms.ModelForm):
    password1 = forms.CharField(widget=forms.PasswordInput())
    password2 = forms.CharField(widget=forms.PasswordInput())

    class Meta:
        model = User
        fields = ["username", "first_name", "last_name", "email", "is_booking_approver"]

    def clean_password2(self):
        if self.cleaned_data.get("password1") != self.cleaned_data.get("password2"):
            raise forms.ValidationError("Passwords do not match.")
        return self.cleaned_data["password2"]

    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = User.Role.STAFF
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class StaffAccountUpdateForm(StyledFieldsMixin, forms.ModelForm):
    class Meta:
        model = User
        fields = ["username", "first_name", "last_name", "email", "is_booking_approver", "is_active"]

import { useState } from "react";
import { Form, redirect, useActionData, useNavigation } from "react-router-dom";
import { createOrder } from "../../services/apiRestaurant";
import Button from "../../ui/Button";
import { useDispatch, useSelector } from "react-redux";
import { clearCart, getCart, getTotalCartPrice } from "../cart/cartSlice";
import EmptyCart from "../cart/EmptyCart";
import store from "../../store"
import { formatCurrency } from "../../utils/helpers";
import { fetchAddress } from "../user/userSlice";
// https://uibakery.io/regex-library/phone-number
const isValidPhone = (str) =>
  /^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/.test(
    str
  );



function CreateOrder() {
 const [withPriority, setWithPriority] = useState(false);
 const dispatch = useDispatch()
  const cart = useSelector(getCart);
  const navigation = useNavigation()
  const isSubmitting = navigation.state === "submitting"
  const {username, status: addressStatus, position, address, error: errorAddress} = useSelector(state => state.user)
  const isLoadingAddress =addressStatus ==="loading"

  const totalCartPrice = useSelector(getTotalCartPrice)
  const priorityPrice = withPriority ? totalCartPrice * 0.2 : 0
  const totalPrice = totalCartPrice + priorityPrice
  const formErrors = useActionData()

  if(!cart.length)  return <EmptyCart />

  return (
    <div className="px-4 py-6">
      <h2 className="text-xl font-semibold  mb-8">Ready to order? Let&apos;s go!  </h2>

      <Form method="POST" action="/order/new">
        <div className="mb-5  flex gap-2 flex-column  sm:flex-row sm:item-center">
          <label className="sm:basis-40">First Name</label>
          <input className="input grow"  defaultValue={username} type="text" name="customer" required />
        </div>

        <div className="mb-5  flex gap-2 flex-column  sm:flex-row sm:item-center">
          <label  className="sm:basis-40">Phone number</label>
          <div className="grow">
            <input className="input w-full" type="tel" name="phone" required />
          {formErrors?.phone && <p className="text-xs mt-2 text-red-700  bg-red-100 p-2 rounded-md"> {formErrors.phone} </p>}
          </div>
        </div>

        <div className="mb-5  flex gap-2 flex-column  sm:flex-row sm:items-center relative">
          <label  className="sm:basis-40">Address</label>
          <div className="grow">
            <input className="input w-full" type="text" name="address"  defaultValue={address} disabled={isLoadingAddress} required />
            {addressStatus === "error" && <p className="text-xs mt-2 text-red-700  bg-red-100 p-2 rounded-md"> {errorAddress} </p>}

          </div>
          {!position.latitude && !position.longitude &&
           <span className="absolute right-[3px] top-[3px]  md:right-[5px] md:top-[5px] z-50"> <Button disabled={isLoadingAddress || isSubmitting} type="small" onClick={(e) => {
                e.preventDefault()
                dispatch(fetchAddress())
           }} 
              >Get Position</Button> </span>}
        </div>

        <div className="mb-12 flex gap-5 items-center">
          <input
          className="h-6 w-6 acceent-yellow-600 focus:outline-none focus:ring focus:ring-yellow-400  focus:ring-offset-2"
            type="checkbox"
            name="priority"
            id="priority"
            value={withPriority}
            onChange={(e) => setWithPriority(e.target.checked)}
          />
          <label className="font-medium" htmlFor="priority">Want to yo give your order priority?</label>
        </div>

        <div className="">
          <input type="hidden" name="cart" value={JSON.stringify(cart)}  />
          <input type="hidden" name="position" value={ position.longitude && position.latitude ? `${position.latitude},${position.longitude}` : ""}  />
          <Button type="primary"  disabled={isSubmitting}>   {isSubmitting ? "Placing order..." : `Order now for ${formatCurrency(totalPrice)}`} </Button>
        </div>
      </Form>
    </div>
  );
}

//form action

export  async function action ({request}) {
  const formData = await request.formData()
  const data = Object.fromEntries(formData)
  console.log(data)

  const order = {
    ...data,
    cart: JSON.parse(data.cart),
    priority: data.priority === "true"
  }
  const errors = {}

  if(!isValidPhone(order.phone)) errors.phone =  "Please give us your correct phone number. We might need it to contact you."

  if(Object.keys(errors).lenght > 0) return errors;

  
  const newOrder = await createOrder(order)

  store.dispatch(clearCart())

  return redirect(`/order/${newOrder.id}`)
}

export default CreateOrder;
